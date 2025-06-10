import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface DbConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

const config: DbConfig = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  host: process.env.DB_HOST!,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  database: process.env.DB_NAME!,
};

const pool = new Pool(config);

// Event listeners para debugging
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

export default pool;