import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL;
  const platformAdminPassword = process.env.PLATFORM_ADMIN_PASSWORD;

  if (!platformAdminEmail || !platformAdminPassword) {
    throw new Error('Missing PLATFORM_ADMIN_EMAIL or PLATFORM_ADMIN_PASSWORD environment variables.');
  }

  // Create admin user
  const adminPassword = await hash(platformAdminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: platformAdminEmail },
    update: {},
    create: {
      email: platformAdminEmail,
      passwordHash: adminPassword,
      name: 'Platform Admin',
      role: 'admin',
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create sample business
  const business = await prisma.business.upsert({
    where: { slug: 'cafe-delight' },
    update: {},
    create: {
      name: 'Café Delight',
      slug: 'cafe-delight',
      ownerName: 'Rahul Sharma',
      ownerEmail: 'rahul@cafedelight.com',
      ownerPhone: '+91 98765 43210',
      googleReviewUrl: 'https://g.page/r/cafe-delight/review',
      description: 'A cozy café serving the finest coffee and pastries in town.',
      address: '123 MG Road, Bengaluru, Karnataka 560001',
      phone: '+91 80 1234 5678',
      category: 'Café & Restaurant',
      brandColor: '#b45309',
      status: 'active',
    },
  });
  console.log(`✅ Sample business created: ${business.name} (${business.slug})`);

  // Create business owner user
  const ownerPassword = await hash('owner123', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'rahul@cafedelight.com' },
    update: {},
    create: {
      email: 'rahul@cafedelight.com',
      passwordHash: ownerPassword,
      name: 'Rahul Sharma',
      role: 'business_owner',
      businessId: business.id,
    },
  });
  console.log(`✅ Owner user created: ${owner.email}`);

  // Create subscription
  const now = new Date();
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 12);

  await prisma.subscription.create({
    data: {
      businessId: business.id,
      plan: '12month',
      amount: 11000,
      startDate: now,
      expiryDate: expiry,
      status: 'active',
    },
  });
  console.log('✅ Subscription created: 12-month plan');

  // Create sample employees
  const employees = [
    { name: 'Priya Patel', employeeCode: 'EMP001', role: 'Barista', slug: 'priya-patel' },
    { name: 'Amit Kumar', employeeCode: 'EMP002', role: 'Waiter', slug: 'amit-kumar' },
    { name: 'Sneha Reddy', employeeCode: 'EMP003', role: 'Manager', slug: 'sneha-reddy' },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: emp.slug,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        name: emp.name,
        employeeCode: emp.employeeCode,
        role: emp.role,
        slug: emp.slug,
        status: 'active',
      },
    });
    console.log(`✅ Employee created: ${emp.name} (${emp.slug})`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log(`  Admin: ${platformAdminEmail} / ${platformAdminPassword}`);
  console.log('  Owner: rahul@cafedelight.com / owner123');
  console.log(`  Business URL: http://cafe-delight.localhost:3000 (or http://localhost:3000?tenant=cafe-delight)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
