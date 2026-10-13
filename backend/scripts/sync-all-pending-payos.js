/**
 * Sync ALL PENDING orders that have a PayOS payment link.
 */
const {
  PrismaClient,
  PackageOrderStatus,
  PaymentProvider,
  PaymentTransactionStatus,
} = require('@prisma/client');
const { PayOS } = require('@payos/node');
require('dotenv').config();

const prisma = new PrismaClient();

function snapshotFromPackage(pkg) {
  return {
    maxActiveJobs: pkg.maxActiveJobs,
    monthlyJobCreateLimit: pkg.monthlyJobCreateLimit ?? null,
    maxApplicantsPerJob: pkg.maxApplicantsPerJob ?? null,
    cvUnlockQuota: pkg.cvUnlockQuota,
    aiRanking: pkg.aiRanking,
    advancedFilters: pkg.advancedFilters,
    recruitmentStats: pkg.recruitmentStats,
    talentPoolAccess: pkg.talentPoolAccess,
    jdFitAnalysis: pkg.jdFitAnalysis,
    cvImproveSuggestions: pkg.cvImproveSuggestions,
    jdFitQuota: pkg.jdFitQuota,
    aiMockInterview: pkg.aiMockInterview,
    mockInterviewQuota: pkg.mockInterviewQuota,
  };
}

async function completePaidOrder(order, provider, providerTxnId, rawPayload) {
  const paidAt = new Date();
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const current = await tx.packageOrder.findUnique({
      where: { id: order.id },
      include: { package: true },
    });
    if (!current) throw new Error('Order missing');
    if (current.status === PackageOrderStatus.PAID) return current;

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
      where: { orderId: current.id, status: PaymentTransactionStatus.PENDING },
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
          rawPayload: rawPayload ?? {},
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
          rawPayload: rawPayload ?? {},
        },
      });
    }
    return updated;
  });

  const existingEnt = await prisma.packageEntitlement.findUnique({
    where: { orderId: updatedOrder.id },
  });
  if (existingEnt) return updatedOrder;

  const pkg = updatedOrder.package;
  const durationDays = updatedOrder.durationDaysSnapshot ?? pkg.durationDays;
  if (!durationDays || durationDays <= 0) throw new Error('Missing durationDays');

  const snapshot =
    (updatedOrder.featuresSnapshot &&
    typeof updatedOrder.featuresSnapshot === 'object'
      ? updatedOrder.featuresSnapshot
      : null) ?? snapshotFromPackage(pkg);

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + durationDays);

  await prisma.packageEntitlement.updateMany({
    where: {
      userId: updatedOrder.userId,
      status: 'ACTIVE',
      package: {
        audience: pkg.audience,
        code: { notIn: ['HR_FREE', 'CANDIDATE_FREE'] },
      },
    },
    data: { status: 'EXPIRED' },
  });

  await prisma.packageEntitlement.create({
    data: {
      userId: updatedOrder.userId,
      companyId: null,
      packageId: pkg.id,
      orderId: updatedOrder.id,
      status: 'ACTIVE',
      startsAt,
      endsAt,
      maxActiveJobs: snapshot.maxActiveJobs ?? null,
      monthlyJobCreateLimit: snapshot.monthlyJobCreateLimit ?? null,
      maxApplicantsPerJob: snapshot.maxApplicantsPerJob ?? null,
      cvUnlockRemaining: snapshot.cvUnlockQuota ?? 0,
      aiRanking: !!snapshot.aiRanking,
      advancedFilters: !!snapshot.advancedFilters,
      recruitmentStats: !!snapshot.recruitmentStats,
      talentPoolAccess: !!snapshot.talentPoolAccess,
      jdFitAnalysis: !!snapshot.jdFitAnalysis,
      cvImproveSuggestions: !!snapshot.cvImproveSuggestions,
      jdFitRemaining: snapshot.jdFitQuota ?? 0,
      aiMockInterview: !!snapshot.aiMockInterview,
      mockInterviewRemaining: snapshot.mockInterviewQuota ?? 0,
    },
  });

  return updatedOrder;
}

async function main() {
  const payOS = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  });

  const orders = await prisma.packageOrder.findMany({
    where: {
      status: PackageOrderStatus.PENDING,
      transactions: { some: { provider: PaymentProvider.PAYOS } },
    },
    include: {
      package: true,
      user: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${orders.length} pending PayOS orders`);
  let completed = 0;

  for (const order of orders) {
    const numeric = Number(String(order.orderCode).replace(/\D/g, ''));
    process.stdout.write(
      `${order.user.email} ${order.orderCode} ${order.package.code} ... `,
    );
    try {
      const info = await payOS.paymentRequests.get(numeric);
      if (info && (info.status === 'PAID' || info.code === '00')) {
        await completePaidOrder(
          order,
          PaymentProvider.PAYOS,
          String(info.id ?? info.paymentLinkId ?? order.orderCode),
          info,
        );
        console.log('PAID -> activated');
        completed += 1;
      } else {
        console.log(info?.status || 'unknown');
      }
    } catch (err) {
      console.log('error:', err.message);
    }
  }

  console.log(`Done. Activated ${completed} order(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
