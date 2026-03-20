import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await client.connect();
    console.log('PG Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
  } catch (err) {
    console.error('PG Connection error:', err);
  } finally {
    await client.end();
  }
}

main();
