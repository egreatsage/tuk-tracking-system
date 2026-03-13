// prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

// 1. Initialize a connection pool using the pg driver
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Create the Prisma adapter using that pool
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

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
    // Close the client and the pool
    await prisma.$disconnect();
    await pool.end();
  });