// middlewares/globalAdmin.js
import dotenv from 'dotenv';
dotenv.config(); // MUST run before reading process.env

export function globalAdminAuth(req, res, next) {
  // Read fresh each call — never cache at module load time
  const GLOBAL_ADMIN_PASSWORD = process.env.GLOBAL_ADMIN_PASSWORD;
  const password =
    req.headers['x-admin-password'] ||
    req.body?.password ||
    req.query?.password;

  if (!GLOBAL_ADMIN_PASSWORD) {
    console.error('[ADMIN] GLOBAL_ADMIN_PASSWORD is not set in environment!');
    return res.status(500).json({ error: 'Server misconfiguration: admin password not set.' });
  }

  if (!password || password !== GLOBAL_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin password.' });
  }

  next();
}
