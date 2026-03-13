// prisma/seed.js
require('dotenv').config(); // Load environment variables
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Prisma v7 requires passing the connection URL explicitly
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('Seeding database...');

  // Hash the password 'admin123'
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create the Super Admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@tuk.ac.ke' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@tuk.ac.ke',
      hashedPassword: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  console.log('✅ Super Admin created:');
  console.log(`Email: ${superAdmin.email}`);
  console.log(`Password: admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });