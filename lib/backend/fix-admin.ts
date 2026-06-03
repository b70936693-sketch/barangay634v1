import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔄 Updating admin user...');
    
    const user = await prisma.user.updateMany({
      where: { email: 'b70936693@gmail.com' },
      data: { 
        role: 'admin',
        status: 'verified'
      }
    });
    
    console.log('✅ Admin user updated:', user);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
