// ─────────────────────────────────────────────────────────
// Environment Configuration – centralises all env vars
// ─────────────────────────────────────────────────────────

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-campus-os',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Access-token signing
  jwtSecret: process.env.JWT_SECRET || 'replace-with-secure-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  // Refresh-token signing
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'replace-with-secure-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

export default env;
