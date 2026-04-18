import pkg from 'pg';
import { env } from './env.js';
const { Pool } = pkg;

const pool = new Pool({
  user: env.db.user,
  host: env.db.host,
  database: env.db.database,
  password: env.db.password,
  port: env.db.port,
});

export default pool;