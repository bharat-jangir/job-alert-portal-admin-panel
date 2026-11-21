/**
 * fetch() wrapper for the admin: attaches the bearer token and signs the user out on 401.
 * Several older pages use raw fetch; this keeps them working against the guarded API.
 */
const isProd =
  typeof window !== 'undefined'
    ? window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    : process.env.NODE_ENV === 'production' || process.env.VERCEL;

const defaultBackendUrl = isProd
  ? 'https://job-alert-portal-backend-wwc6.onrender.com'
  : 'http://localhost:5000';

const configuredUrl =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL;

export const API_BASE = (
  isProd && (!configuredUrl || configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1'))
    ? defaultBackendUrl
    : (configuredUrl || defaultBackendUrl)
).replace(/\/$/, '');

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  }
  return res;
}

/**
 * Turns a failed API response into a readable message: the server's validation text
 * (e.g. "slug must be lowercase letters, numbers and hyphens") instead of a generic one.
 */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    const m = body?.error?.message ?? body?.message;
    if (m) return Array.isArray(m) ? m.join(', ') : String(m);
  } catch {}
  return res.status === 409 ? 'That already exists (name or slug is taken).' : fallback;
}
