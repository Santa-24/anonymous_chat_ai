// middlewares/globalAdmin.js
import dotenv from 'dotenv';
dotenv.config();

export const GLOBAL_ADMIN_PASSWORD = process.env.GLOBAL_ADMIN_PASSWORD;

export function globalAdminAuth(req, res, next) {
  const password =
    req.headers['x-admin-password'] ||
    req.body?.password ||
    req.query?.password;

  if (!password || password !== GLOBAL_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin password.' });
  }
  next();
}
