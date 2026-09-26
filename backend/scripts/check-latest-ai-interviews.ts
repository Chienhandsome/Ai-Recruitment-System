import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const notifs = await prisma.notification.findMany({
    where: { recipientUserId: 'db579160-2965-432a-b9a2-5f2cc50f5f97' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log(JSON.stringify(notifs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
