import fs from 'node:fs';
import path from 'node:path';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const match = envFile.split(/\r?\n/).find((line) => line.startsWith('DATABASE_URL='));
if (!match) {
  throw new Error('DATABASE_URL not found in .env.local');
}
const url = match.replace(/^DATABASE_URL=/, '').replace(/^"|"$/g, '');
const cleanedUrl = url.replace(/\?pgbouncer=true$/, '');
process.env.DATABASE_URL = cleanedUrl;

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'john', mode: 'insensitive' } },
  });
  const verifications = await prisma.verification.findMany({
    where: { email: { contains: 'john', mode: 'insensitive' } },
  });
  console.log('USERS', JSON.stringify(users, null, 2));
  console.log('VERIFICATIONS', JSON.stringify(verifications, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
