import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  PackageAudience,
  PackageOrderStatus,
  PaymentProvider,
  PaymentTransactionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EntitlementsService } from './entitlements.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProviderAdapter,
} from './payment/payment-provider.interface';
import { PayosPaymentProvider } from './payment/payos-payment.provider';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import {
  PACKAGE_CODES,
  isMockPaymentAllowed,
  snapshotFromPackage,
} from './billing.types';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProviderAdapter,
  ) {}

  listPackages(audience: PackageAudience, includeInactive = false) {
    return this.prisma.servicePackage.findMany({
      where: {
        audience,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** @deprecated Prefer listPackages(PackageAudience.EMPLOYER) — kept for HR call sites */
  listEmployerPackages(includeInactive = false) {
    return this.listPackages(PackageAudience.EMPLOYER, includeInactive);
  }

  async updatePackage(packageId: string, dto: UpdatePackageDto) {
    const existing = await this.prisma.servicePackage.findUnique({
      where: { id: packageId },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy gói dịch vụ.');
    }

    return this.prisma.servicePackage.update({
      where: { id: packageId },
      data: {
        name: dto.name,
        description: dto.description,
        priceVnd: dto.priceVnd,
        durationDays: dto.durationDays,
        maxActiveJobs: dto.maxActiveJobs,
        monthlyJobCreateLimit: dto.monthlyJobCreateLimit,
        maxApplicantsPerJob: dto.maxApplicantsPerJob,
        cvUnlockQuota: dto.cvUnlockQuota,
        aiRanking: dto.aiRanking,
        advancedFilters: dto.advancedFilters,
        recruitmentStats: dto.recruitmentStats,
        talentPoolAccess: dto.talentPoolAccess,
        jdFitAnalysis: dto.jdFitAnalysis,
        cvImproveSuggestions: dto.cvImproveSuggestions,
        jdFitQuota: dto.jdFitQuota,
        aiMockInterview: dto.aiMockInterview,
        mockInterviewQuota: dto.mockInterviewQuota,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  getMyStatus(userId: string, audience: PackageAudience) {
    return this.entitlements.getEntitlementStatus(userId, audience);
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const pkg = await this.prisma.servicePackage.findFirst({
      where: {
        code: dto.packageCode,
        isActive: true,
      },
    });
    if (!pkg) {
      throw new NotFoundException('Gói dịch vụ không tồn tại hoặc đã tắt.');
    }

    if (pkg.audience === PackageAudience.EMPLOYER) {
      const recruiter = await this.prisma.recruiterProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!recruiter) {
        throw new ForbiddenException(
          'Chỉ tài khoản nhà tuyển dụng mới mua gói HR.',
        );
      }
    } else {
      const candidate = await this.prisma.candidateProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!candidate) {
        throw new ForbiddenException(
          'Chỉ tài khoản ứng viên mới mua gói Candidate.',
        );
      }
    }

    if (
      pkg.code === PACKAGE_CODES.HR_FREE ||
      pkg.code === PACKAGE_CODES.CANDIDATE_FREE ||
      pkg.priceVnd <= 0
    ) {
      throw new BadRequestException(
        'Gói Free là mặc định, không cần thanh toán.',
      );
    }

    const pending = await this.prisma.packageOrder.findFirst({
      where: {
        userId,
        packageId: pkg.id,
        status: PackageOrderStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
    if (pending) {
      return this.toOrderResponse(pending, pkg);
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);
    const featuresSnapshot = snapshotFromPackage(pkg);

    const order = await this.prisma.packageOrder.create({
      data: {
        orderCode: this.generateOrderCode(),
        userId,
        packageId: pkg.id,
        amountVnd: pkg.priceVnd,
        currency: 'VND',
        status: PackageOrderStatus.PENDING,
        paymentProvider: PaymentProvider.MOCK,
        packageCodeSnapshot: pkg.code,
        durationDaysSnapshot: pkg.durationDays,
        featuresSnapshot: featuresSnapshot as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return this.toOrderResponse(order, pkg);
  }

  async checkout(userId: string, orderId: string, checkoutPath: string) {
    const order = await this.findOwnedOrder(userId, orderId);
    if (order.status !== PackageOrderStatus.PENDING) {
      throw new BadRequestException(
        'Đơn hàng không còn ở trạng thái chờ thanh toán.',
      );
    }
    if (order.expiresAt && order.expiresAt < new Date()) {
      await this.prisma.packageOrder.update({
        where: { id: order.id },
        data: { status: PackageOrderStatus.EXPIRED },
      });
      throw new BadRequestException('Đơn hàng đã hết hạn. Vui lòng tạo đơn mới.');
    }

    const siteUrl = process.env.FRONTEND_SITE_URL ?? 'http://localhost:3000';
    const checkout = await this.paymentProvider.createCheckout({
      orderId: order.id,
      orderCode: order.orderCode,
      amountVnd: order.amountVnd,
      returnUrl: `${siteUrl}${checkoutPath}?orderCode=${order.orderCode}&status=PAID`,
      cancelUrl: `${siteUrl}${checkoutPath}?orderCode=${order.orderCode}&status=CANCELLED`,
    });

    let checkoutUrl = checkout.checkoutUrl;
    if (checkout.provider === PaymentProvider.MOCK) {
      const mockUrl = new URL(`${siteUrl}${checkoutPath}/checkout`);
      mockUrl.searchParams.set('orderId', order.id);
      mockUrl.searchParams.set('session', checkout.providerSessionId);
      checkoutUrl = mockUrl.toString();
    }

    await this.prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: checkout.provider,
        providerTxnId: checkout.providerSessionId,
        amountVnd: order.amountVnd,
        status: PaymentTransactionStatus.PENDING,
        rawPayload: {
          checkoutUrl,
          sessionId: checkout.providerSessionId,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      orderId: order.id,
      orderCode: order.orderCode,
      amountVnd: order.amountVnd,
      provider: checkout.provider,
      checkoutUrl,
      providerSessionId: checkout.providerSessionId,
    };
  }

  async completePaidOrder(
    order: any,
    provider: PaymentProvider,
    providerTxnId: string,
    rawPayload: any,
  ) {
    const paidAt = new Date();

    // Atomic + idempotent: webhook and return-URL check-status can race.
    const { updatedOrder, alreadyPaid } = await this.prisma.$transaction(
      async (tx) => {
        const current = await tx.packageOrder.findUnique({
          where: { id: order.id },
          include: { package: true },
        });
        if (!current) {
          throw new NotFoundException('Không tìm thấy đơn hàng.');
        }
        if (current.status === PackageOrderStatus.PAID) {
          return { updatedOrder: current, alreadyPaid: true };
        }

        const updated = await tx.packageOrder.update({
          where: { id: current.id },
          data: {
            status: PackageOrderStatus.PAID,
            paidAt,
            paymentProvider: provider,
          },
          include: { package: true },
        });

        const pendingTx = await tx.paymentTransaction.findFirst({
          where: {
            orderId: current.id,
            status: PaymentTransactionStatus.PENDING,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (pendingTx) {
          await tx.paymentTransaction.update({
            where: { id: pendingTx.id },
            data: {
              provider,
              providerTxnId,
              status: PaymentTransactionStatus.SUCCESS,
              paidAt,
              rawPayload: (rawPayload ?? {}) as Prisma.InputJsonValue,
            },
          });
        } else {
          await tx.paymentTransaction.create({
            data: {
              orderId: current.id,
              provider,
              providerTxnId,
              amountVnd: current.amountVnd,
              status: PaymentTransactionStatus.SUCCESS,
              paidAt,
              rawPayload: (rawPayload ?? {}) as Prisma.InputJsonValue,
            },
          });
        }

        return { updatedOrder: updated, alreadyPaid: false };
      },
    );

    const audience = updatedOrder.package.audience;
    const featuresSnapshot =
      (updatedOrder.featuresSnapshot as unknown as ReturnType<
        typeof snapshotFromPackage
      >) ??
      (order.featuresSnapshot as unknown as ReturnType<
        typeof snapshotFromPackage
      >) ??
      snapshotFromPackage(updatedOrder.package);

    // activateFromPaidOrder is itself idempotent per orderId.
    await this.entitlements.activateFromPaidOrder({
      userId: updatedOrder.userId,
      packageId: updatedOrder.packageId,
      orderId: updatedOrder.id,
      audience,
      featuresSnapshot,
      durationDaysSnapshot:
        updatedOrder.durationDaysSnapshot ?? order.durationDaysSnapshot,
    });

    if (alreadyPaid) {
      this.logger.log(
        `Order ${updatedOrder.orderCode} already PAID — ensured entitlement is active.`,
      );
    }

    return updatedOrder;
  }

  async confirmMockPayment(userId: string, orderId: string) {
    if (!isMockPaymentAllowed()) {
      throw new ForbiddenException(
        'Mock payment bị tắt trên môi trường production.',
      );
    }

    if (!this.paymentProvider.confirmMockPayment) {
      throw new BadRequestException(
        'Nhà cung cấp thanh toán hiện tại không hỗ trợ xác nhận sandbox.',
      );
    }

    const order = await this.findOwnedOrder(userId, orderId);
    const audience = order.package.audience;

    if (order.status === PackageOrderStatus.PAID) {
      const entitlement = await this.entitlements.getEntitlementStatus(
        userId,
        audience,
      );
      return {
        order: this.toOrderResponse(order, order.package),
        entitlement,
        alreadyPaid: true,
      };
    }
    if (order.status !== PackageOrderStatus.PENDING) {
      throw new BadRequestException('Không thể thanh toán đơn hàng này.');
    }
    if (order.expiresAt && order.expiresAt < new Date()) {
      await this.prisma.packageOrder.update({
        where: { id: order.id },
        data: { status: PackageOrderStatus.EXPIRED },
      });
      throw new BadRequestException('Đơn hàng đã hết hạn.');
    }

    const confirm = await this.paymentProvider.confirmMockPayment(order.id);
    const result = await this.completePaidOrder(
      order,
      confirm.provider,
      confirm.providerTxnId,
      confirm.rawPayload,
    );

    const entitlement = await this.entitlements.getEntitlementStatus(
      userId,
      audience,
    );

    return {
      order: this.toOrderResponse(result, result.package),
      entitlement,
      alreadyPaid: false,
    };
  }

  async handlePayosWebhook(body: any) {
    let webhookData: any = body;
    if (this.paymentProvider instanceof PayosPaymentProvider) {
      try {
        webhookData = await this.paymentProvider.verifyWebhook(body);
      } catch (err: any) {
        this.logger.warn(`PayOS webhook signature verification error: ${err.message}`);
        // If verify fails, fall back to body.data
        webhookData = body?.data ?? body;
      }
    } else {
      webhookData = body?.data ?? body;
    }

    const orderCode = webhookData?.orderCode ?? body?.data?.orderCode;
    if (!orderCode) {
      this.logger.warn('PayOS webhook missing orderCode.');
      return { success: false, message: 'Missing orderCode' };
    }

    const orderCodeStr = String(orderCode);
    const order = await this.prisma.packageOrder.findFirst({
      where: {
        OR: [{ orderCode: orderCodeStr }, { id: orderCodeStr }],
      },
      include: { package: true },
    });

    if (!order) {
      this.logger.warn(`PayOS webhook: Order not found for orderCode ${orderCodeStr}`);
      return { success: false, message: 'Order not found' };
    }

    const isSuccess =
      webhookData?.code === '00' ||
      body?.code === '00' ||
      body?.success === true ||
      webhookData?.desc?.toLowerCase?.() === 'thành công';

    if (isSuccess && order.status !== PackageOrderStatus.PAID) {
      const provider =
        ((PaymentProvider as any).PAYOS as PaymentProvider) ??
        PaymentProvider.MOCK;
      await this.completePaidOrder(
        order,
        provider,
        String(webhookData?.paymentLinkId ?? webhookData?.reference ?? order.orderCode),
        webhookData,
      );
      this.logger.log(`PayOS webhook: Order ${order.orderCode} successfully paid and entitlement activated.`);
    }

    return { success: true };
  }

  async checkPayosOrderStatus(userId: string, orderCodeOrId: string) {
    const order = await this.prisma.packageOrder.findFirst({
      where: {
        userId,
        OR: [{ id: orderCodeOrId }, { orderCode: orderCodeOrId }],
      },
      include: { package: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    const buildPaidResponse = async (paidOrder: typeof order) => {
      const entitlement = await this.entitlements.getEntitlementStatus(
        userId,
        paidOrder.package.audience,
      );
      return {
        order: this.toOrderResponse(paidOrder, paidOrder.package),
        entitlement,
        isPaid: true as const,
      };
    };

    if (order.status === PackageOrderStatus.PAID) {
      return buildPaidResponse(order);
    }

    // If still PENDING and PayOS provider is active, check PayOS API directly.
    if (this.paymentProvider instanceof PayosPaymentProvider) {
      const payosInfo = await this.paymentProvider.getPaymentInformation(
        order.orderCode,
      );
      if (
        payosInfo &&
        (payosInfo.status === 'PAID' || (payosInfo as any).code === '00')
      ) {
        const provider =
          ((PaymentProvider as any).PAYOS as PaymentProvider) ??
          PaymentProvider.MOCK;
        try {
          const completed = await this.completePaidOrder(
            order,
            provider,
            String(
              (payosInfo as any).id ??
                (payosInfo as any).paymentLinkId ??
                order.orderCode,
            ),
            payosInfo,
          );
          return buildPaidResponse(completed);
        } catch (err) {
          // Another request (webhook / Strict Mode) may have finished first.
          this.logger.warn(
            `checkPayosOrderStatus complete race for ${order.orderCode}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          const refreshed = await this.prisma.packageOrder.findFirst({
            where: { id: order.id, userId },
            include: { package: true },
          });
          if (refreshed?.status === PackageOrderStatus.PAID) {
            return buildPaidResponse(refreshed);
          }
          throw err;
        }
      }
    }

    const entitlement = await this.entitlements.getEntitlementStatus(
      userId,
      order.package.audience,
    );
    return {
      order: this.toOrderResponse(order, order.package),
      entitlement,
      isPaid: false,
    };
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.findOwnedOrder(userId, orderId);
    return this.toOrderResponse(order, order.package);
  }

  async listMyOrders(userId: string, audience?: PackageAudience) {
    const orders = await this.prisma.packageOrder.findMany({
      where: {
        userId,
        ...(audience ? { package: { audience } } : {}),
      },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return orders.map((o) => this.toOrderResponse(o, o.package));
  }

  async listMyTransactions(userId: string, audience?: PackageAudience) {
    return this.prisma.paymentTransaction.findMany({
      where: {
        order: {
          userId,
          ...(audience ? { package: { audience } } : {}),
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderCode: true,
            status: true,
            package: { select: { code: true, name: true, audience: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async findOwnedOrder(userId: string, orderId: string) {
    const order = await this.prisma.packageOrder.findFirst({
      where: { id: orderId, userId },
      include: { package: true },
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }
    return order;
  }

  private generateOrderCode(): string {
    const now = Date.now();
    const rand = Math.floor(10 + Math.random() * 90);
    return `${now}${rand}`;
  }

  private toOrderResponse(
    order: {
      id: string;
      orderCode: string;
      amountVnd: number;
      currency: string;
      status: PackageOrderStatus;
      paymentProvider: PaymentProvider;
      packageCodeSnapshot?: string;
      durationDaysSnapshot?: number | null;
      featuresSnapshot?: unknown;
      expiresAt: Date | null;
      paidAt: Date | null;
      createdAt: Date;
    },
    pkg: {
      id: string;
      code: string;
      name: string;
      durationDays: number | null;
      audience?: PackageAudience;
    },
  ) {
    return {
      id: order.id,
      orderCode: order.orderCode,
      amountVnd: order.amountVnd,
      currency: order.currency,
      status: order.status,
      paymentProvider: order.paymentProvider,
      packageCodeSnapshot: order.packageCodeSnapshot ?? pkg.code,
      durationDaysSnapshot: order.durationDaysSnapshot ?? pkg.durationDays,
      featuresSnapshot: order.featuresSnapshot ?? null,
      expiresAt: order.expiresAt,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      package: {
        id: pkg.id,
        code: pkg.code,
        name: pkg.name,
        durationDays: pkg.durationDays,
        audience: pkg.audience,
      },
    };
  }
}
