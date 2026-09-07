import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'LiveClass'
    ORDER BY ordinal_position;
  `);
  console.log("Columns in LiveClass table:", res.rows);
  await pool.end();
}

main().catch(console.error);
