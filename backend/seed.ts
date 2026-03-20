import bcrypt from 'bcryptjs';
import prisma from './src/utils/db.js';

async function main() {
  const email = 'admin@balaji.com';
  const password = 'adminpassword123';
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log('Admin user already exists.');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Super Admin created successfully!');
  console.log('Email: admin@balaji.com');
  console.log('Password: adminpassword123');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
