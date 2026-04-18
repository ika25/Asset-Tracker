import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const parsePort = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const requireInProduction = (value, name, fallback) => {
  if (value !== undefined) {
    return value;
  }

  if (isProduction) {
    throw new Error(`${name} must be set in production.`);
  }

  return fallback;
};

export const env = {
  nodeEnv,
  isProduction,
  port: parsePort(process.env.PORT, 5000),
  db: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'asset-tracker',
    password: requireInProduction(process.env.DB_PASSWORD, 'DB_PASSWORD', '0000'),
    port: parsePort(process.env.DB_PORT, 5432),
  },
};