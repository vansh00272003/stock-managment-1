import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/balaji' });

async function inspect() {
  try {
    const res = await pool.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Invoice';
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

inspect();
