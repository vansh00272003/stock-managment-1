import prisma from './src/utils/db.js';

async function test() {
  try {
    const now = new Date();
    console.log('Testing updateMany...');
    await prisma.invoice.updateMany({
      where: {
        status: { notIn: ['PAID', 'CANCELLED', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });
    console.log('Success!');
  } catch (err) {
    console.error('ERROR TYPE:', err.constructor.name);
    console.error('ERROR MESSAGE:', err.message);
  } finally {
    process.exit();
  }
}

test();
