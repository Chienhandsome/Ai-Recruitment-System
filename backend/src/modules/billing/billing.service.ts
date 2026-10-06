import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import {
  PACKAGE_CODES,
  isMockPaymentAllowed,
  snapshotFromPackage,
} from './billing.types';

@Injectable()
export class BillingService {
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
    // Temporarily override checkout URL builder via return paths
    const checkout = await this.paymentProvider.createCheckout({
      orderId: order.id,
      orderCode: order.orderCode,
      amountVnd: order.amountVnd,
      returnUrl: `${siteUrl}${checkoutPath}/result?orderId=${order.id}`,
      cancelUrl: `${siteUrl}${checkoutPath}?cancelled=1`,
    });

    // Rewrite checkout URL to the audience-specific path while keeping session id
    const checkoutUrl = new URL(`${siteUrl}${checkoutPath}/checkout`);
    checkoutUrl.searchParams.set('orderId', order.id);
    checkoutUrl.searchParams.set('session', checkout.providerSessionId);

    await this.prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: checkout.provider,
        providerTxnId: checkout.providerSessionId,
        amountVnd: order.amountVnd,
        status: PaymentTransactionStatus.PENDING,
        rawPayload: {
          checkoutUrl: checkoutUrl.toString(),
          sessionId: checkout.providerSessionId,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      orderId: order.id,
      orderCode: order.orderCode,
      amountVnd: order.amountVnd,
      provider: checkout.provider,
      checkoutUrl: checkoutUrl.toString(),
      providerSessionId: checkout.providerSessionId,
    };
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
    const paidAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.packageOrder.update({
        where: { id: order.id },
        data: { status: PackageOrderStatus.PAID, paidAt },
        include: { package: true },
      });

      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: confirm.provider,
          providerTxnId: confirm.providerTxnId,
          amountVnd: order.amountVnd,
          status: confirm.status,
          paidAt,
          rawPayload: confirm.rawPayload as Prisma.InputJsonValue,
        },
      });

      return updatedOrder;
    });

    const featuresSnapshot =
      (order.featuresSnapshot as unknown as ReturnType<
        typeof snapshotFromPackage
      >) ?? snapshotFromPackage(order.package);

    await this.entitlements.activateFromPaidOrder({
      userId,
      packageId: order.packageId,
      orderId: order.id,
      audience,
      featuresSnapshot,
      durationDaysSnapshot: order.durationDaysSnapshot,
    });

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
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `ORD-${stamp}-${rand}`;
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
