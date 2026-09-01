const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = new PrismaClient();

  try {
    const passwordHash = await hash(password, 12);

    const admin = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        passwordHash,
        name: 'Platform Admin',
        role: 'admin',
      },
      create: {
        email: normalizedEmail,
        passwordHash,
        name: 'Platform Admin',
        role: 'admin',
      },
    });

    console.log(`✅ Admin user seeded successfully: ${admin.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Failed to seed admin user:', error);
  process.exit(1);
});
