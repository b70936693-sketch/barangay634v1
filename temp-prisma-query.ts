import { prisma } from './lib/backend/prisma';

async function main() {
  const users = await prisma.user.findMany({
    where: { status: { in: ['pending', 'verified', 'suspended'] } },
    take: 100,
  });
  const verifications = await prisma.verification.findMany({
    take: 100,
    orderBy: { submittedAt: 'desc' },
  });
  console.log('USERS:', JSON.stringify(users, null, 2));
  console.log('VERIFICATIONS:', JSON.stringify(verifications, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
