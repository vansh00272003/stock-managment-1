import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/balaji' });

async function fix() {
  try {
    await pool.query('ALTER TABLE "Invoice" ALTER COLUMN "orderId" DROP NOT NULL');
    await pool.query('ALTER TABLE "Invoice" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()');
    await pool.query('ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" SET DEFAULT now()');
    await pool.query('ALTER TABLE "Invoice" ALTER COLUMN "amount" SET DEFAULT 0');
    console.log('Fixed Nullable orderId, id default, updatedAt default, and amount default');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

fix();
