const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dumpUser(emailPart) {
  const user = await prisma.user.findFirst({
    where: { email: { contains: emailPart, mode: 'insensitive' } },
    select: { id: true, email: true },
  });
  console.log('\n==== USER', emailPart, user);

  if (!user) return;

  const orders = await prisma.packageOrder.findMany({
    where: { userId: user.id },
    include: { package: { select: { code: true, name: true, audience: true } } },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });
  console.log(
    'ORDERS',
    JSON.stringify(
      orders.map((o) => ({
        orderCode: o.orderCode,
        status: o.status,
        amountVnd: o.amountVnd,
        paymentProvider: o.paymentProvider,
        paidAt: o.paidAt,
        package: o.package.code,
        createdAt: o.createdAt,
      })),
      null,
      2,
    ),
  );

  const ents = await prisma.packageEntitlement.findMany({
    where: { userId: user.id },
    include: { package: { select: { code: true, name: true, audience: true } } },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });
  console.log(
    'ENTS',
    JSON.stringify(
      ents.map((e) => ({
        status: e.status,
        orderId: e.orderId,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        package: e.package.code,
        now: new Date().toISOString(),
        stillValid: !e.endsAt || e.endsAt > new Date(),
      })),
      null,
      2,
    ),
  );

  const txs = await prisma.paymentTransaction.findMany({
    where: { order: { userId: user.id } },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });
  console.log(
    'TXS',
    JSON.stringify(
      txs.map((t) => ({
        orderId: t.orderId,
        provider: t.provider,
        status: t.status,
        amountVnd: t.amountVnd,
        paidAt: t.paidAt,
      })),
      null,
      2,
    ),
  );
}

async function main() {
  const paidTest = await prisma.packageOrder.findMany({
    where: { package: { code: 'HR_TEST' } },
    include: {
      package: { select: { code: true } },
      user: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  console.log(
    'ALL_HR_TEST_ORDERS',
    JSON.stringify(
      paidTest.map((o) => ({
        email: o.user.email,
        status: o.status,
        orderCode: o.orderCode,
        amountVnd: o.amountVnd,
        paidAt: o.paidAt,
        paymentProvider: o.paymentProvider,
      })),
      null,
      2,
    ),
  );

  await dumpUser('bechin291');
  await dumpUser('pechin');
  await dumpUser('chin291');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
