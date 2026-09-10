import adminFans from '../backend/api/admin/fans/index.mjs';
import analytics from '../backend/api/analytics/index.mjs';
import authLogin from '../backend/api/auth/login.mjs';
import authLogout from '../backend/api/auth/logout.mjs';
import authRegister from '../backend/api/auth/register/index.mjs';
import authSession from '../backend/api/auth/session.mjs';
import chatSync from '../backend/api/chat-sync/index.mjs';
import chats from '../backend/api/chats/index.mjs';
import creatorProfile from '../backend/api/creator/profile/index.mjs';
import earnings from '../backend/api/earnings/index.mjs';
import gifts from '../backend/api/gifts/index.mjs';
import exportData from '../backend/api/export/index.mjs';
import healthApp from '../backend/api/health/app.mjs';
import healthDb from '../backend/api/health/db.mjs';
import messages from '../backend/api/messages/index.mjs';
import notifications from '../backend/api/notifications/index.mjs';
import publicCreator from '../backend/api/public/creator/index.mjs';
import paymentOrders from '../backend/api/payments/orders.mjs';
import paymentVerify from '../backend/api/payments/verify.mjs';
import posts from '../backend/api/posts/index.mjs';
import settings from '../backend/api/settings/index.mjs';
import storage from '../backend/api/storage/index.mjs';
import subscriptions from '../backend/api/subscriptions/index.mjs';
import upiVerify from '../backend/api/upi/verify.mjs';
import usersMe from '../backend/api/users/me.mjs';
import wallet from '../backend/api/wallet/index.mjs';

const ROUTES = new Map([
  ['/api/admin/fans', adminFans],
  ['/api/analytics', analytics],
  ['/api/auth/login', authLogin],
  ['/api/auth/logout', authLogout],
  ['/api/auth/register', authRegister],
  ['/api/auth/session', authSession],
  ['/api/chat-sync', chatSync],
  ['/api/chats', chats],
  ['/api/creator/profile', creatorProfile],
  ['/api/earnings', earnings],
  ['/api/gifts', gifts],
  ['/api/export', exportData],
  ['/api/health/app', healthApp],
  ['/api/health/db', healthDb],
  ['/api/messages', messages],
  ['/api/notifications', notifications],
  ['/api/public/creator', publicCreator],
  ['/api/payments/orders', paymentOrders],
  ['/api/payments/verify', paymentVerify],
  ['/api/posts', posts],
  ['/api/settings', settings],
  ['/api/storage', storage],
  ['/api/subscriptions', subscriptions],
  ['/api/upi/verify', upiVerify],
  ['/api/users/me', usersMe],
  ['/api/wallet', wallet],
]);

function getPath(req) {
  const q = req && req.query && req.query.path;
  const fromQuery = Array.isArray(q) && q.length
    ? q.map(String).join('/')
    : (typeof q === 'string' && q ? q : '');

  const normalize = (value) => {
    const raw = String(value || '').trim();
    if (!raw || raw === '/api/[...path]' || raw === '/api/index.mjs') return '';
    try {
      const pathname = new URL(raw, 'http://localhost').pathname;
      const clean = pathname.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';
      if (clean === '/api/[...path]' || clean === '/api/index.mjs') return '';
      return clean;
    } catch {
      return '';
    }
  };

  // Vercel's catch-all parameter is the authoritative source when present.
  // Fall back to the request URL/headers for compatibility across runtimes.
  const pathFromQuery = normalize(fromQuery.startsWith('/api/') ? fromQuery : `/api/${fromQuery}`);
  if (pathFromQuery) return pathFromQuery;

  const candidates = [
    req && req.url,
    req && req.headers && req.headers['x-invoke-path'],
    req && req.headers && req.headers['x-matched-path'],
  ];
  for (const candidate of candidates) {
    const path = normalize(candidate);
    if (path) return path;
  }

  return '/api';
}
function hydrateQuery(req) {
  if (req.query && typeof req.query === 'object' && Object.keys(req.query).length) return;
  try {
    const u = new URL(String(req.url || ''), 'http://localhost');
    const query = {};
    for (const [key, value] of u.searchParams.entries()) {
      if (Object.prototype.hasOwnProperty.call(query, key)) {
        query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value];
      } else query[key] = value;
    }
    req.query = query;
  } catch {}
}

export default async function handler(req, res) {
  hydrateQuery(req);
  const path = getPath(req);
  const route = ROUTES.get(path);
  if (!route) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'API route not found' }));
    return;
  }
  return route(req, res);
}
