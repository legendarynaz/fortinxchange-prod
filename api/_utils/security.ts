import type { VercelRequest, VercelResponse } from '@vercel/node';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

interface RateLimitConfig {
  key: string;
  max: number;
  windowMs: number;
}

interface ApiSecurityOptions {
  methods: HttpMethod[];
  rateLimit?: RateLimitConfig;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitState>();

const DEFAULT_ALLOWED_ORIGINS = [
  'https://4ortin-x.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

const getAllowedOrigins = (): string[] => {
  const envOrigins = [
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.ALLOWED_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]));
};

export const getClientIp = (req: VercelRequest): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  return getAllowedOrigins().includes(origin);
};

export const setSecurityHeaders = (res: VercelResponse): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  res.setHeader('Cache-Control', 'no-store');
};

export const applyCors = (
  req: VercelRequest,
  res: VercelResponse,
  methods: HttpMethod[]
): boolean => {
  const origin = req.headers.origin;
  const requestOrigin = Array.isArray(origin) ? origin[0] : origin;

  if (!isAllowedOrigin(requestOrigin)) {
    res.status(403).json({ error: 'Origin not allowed' });
    return false;
  }

  if (requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', Array.from(new Set([...methods, 'OPTIONS'])).join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  return true;
};

export const enforceRateLimit = (
  req: VercelRequest,
  res: VercelResponse,
  config: RateLimitConfig
): boolean => {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${config.key}:${ip}`;
  const state = rateLimitStore.get(key);

  if (!state || state.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (state.count >= config.max) {
    const retryAfter = Math.ceil((state.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return false;
  }

  state.count += 1;
  rateLimitStore.set(key, state);
  return true;
};

export const applyApiSecurity = (
  req: VercelRequest,
  res: VercelResponse,
  options: ApiSecurityOptions
): boolean => {
  setSecurityHeaders(res);

  if (!applyCors(req, res, options.methods)) {
    return false;
  }

  if (!options.methods.includes(req.method as HttpMethod)) {
    res.setHeader('Allow', options.methods.join(', '));
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }

  if (options.rateLimit && !enforceRateLimit(req, res, options.rateLimit)) {
    return false;
  }

  return true;
};

export const normalizeEmail = (email: unknown): string | null => {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(normalized) || normalized.length > 254) return null;
  return normalized;
};

export const normalizeVerificationCode = (code: unknown): string | null => {
  if (typeof code !== 'string') return null;
  const normalized = code.trim();
  return /^\d{6}$/.test(normalized) ? normalized : null;
};

export const normalizeWalletAddress = (address: unknown): string | null => {
  if (typeof address !== 'string') return null;
  const normalized = address.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(normalized)) return normalized.toLowerCase();
  if (normalized.startsWith('T') && /^[1-9A-HJ-NP-Za-km-z]{34}$/.test(normalized)) return normalized;
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(normalized) || /^bc1[a-z0-9]{39,59}$/.test(normalized)) {
    return normalized;
  }
  return null;
};

export const normalizeString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
};

export const normalizeNumber = (
  value: unknown,
  options: { min?: number; max?: number } = {}
): number | null => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return null;
  if (options.min !== undefined && parsed < options.min) return null;
  if (options.max !== undefined && parsed > options.max) return null;
  return parsed;
};

export const normalizeInteger = (
  value: unknown,
  options: { min?: number; max?: number } = {}
): number | null => {
  const parsed = normalizeNumber(value, options);
  if (parsed === null || !Number.isInteger(parsed)) return null;
  return parsed;
};

export const safeJsonObject = (value: unknown, maxLength: number = 2000): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const serialized = JSON.stringify(value);
  if (serialized.length > maxLength) return undefined;
  return JSON.parse(serialized) as Record<string, unknown>;
};
