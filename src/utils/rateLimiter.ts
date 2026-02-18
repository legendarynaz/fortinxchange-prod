/**
 * Rate Limiter Utility
 * Prevents abuse by limiting the number of requests within a time window
 */

interface RateLimitConfig {
  maxRequests: number;    // Maximum requests allowed
  windowMs: number;       // Time window in milliseconds
  blockDurationMs: number; // How long to block after exceeding limit
}

interface RateLimitState {
  requests: number[];     // Timestamps of requests
  blockedUntil: number;   // Timestamp when block expires
}

const rateLimitStates = new Map<string, RateLimitState>();

// Default configurations for different actions
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowMs: 60000, blockDurationMs: 300000 },        // 5 per minute, block 5 min
  signup: { maxRequests: 3, windowMs: 60000, blockDurationMs: 600000 },       // 3 per minute, block 10 min
  passwordReset: { maxRequests: 3, windowMs: 300000, blockDurationMs: 900000 }, // 3 per 5 min, block 15 min
  trade: { maxRequests: 30, windowMs: 60000, blockDurationMs: 60000 },        // 30 per minute, block 1 min
  withdraw: { maxRequests: 5, windowMs: 300000, blockDurationMs: 600000 },    // 5 per 5 min, block 10 min
  api: { maxRequests: 100, windowMs: 60000, blockDurationMs: 60000 },         // 100 per minute, block 1 min
};

/**
 * Check if an action is rate limited
 * @returns Object with isLimited flag and optional retryAfter in seconds
 */
export function checkRateLimit(
  action: string,
  identifier: string = 'default'
): { isLimited: boolean; retryAfter?: number; remainingRequests?: number } {
  const config = RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.api;
  const key = `${action}:${identifier}`;
  const now = Date.now();

  let state = rateLimitStates.get(key);
  
  if (!state) {
    state = { requests: [], blockedUntil: 0 };
    rateLimitStates.set(key, state);
  }

  // Check if currently blocked
  if (state.blockedUntil > now) {
    return {
      isLimited: true,
      retryAfter: Math.ceil((state.blockedUntil - now) / 1000),
    };
  }

  // Clean up old requests outside the window
  state.requests = state.requests.filter(
    timestamp => now - timestamp < config.windowMs
  );

  // Check if limit exceeded
  if (state.requests.length >= config.maxRequests) {
    state.blockedUntil = now + config.blockDurationMs;
    return {
      isLimited: true,
      retryAfter: Math.ceil(config.blockDurationMs / 1000),
    };
  }

  // Record this request
  state.requests.push(now);

  return {
    isLimited: false,
    remainingRequests: config.maxRequests - state.requests.length,
  };
}

/**
 * Reset rate limit for a specific action/identifier
 */
export function resetRateLimit(action: string, identifier: string = 'default'): void {
  const key = `${action}:${identifier}`;
  rateLimitStates.delete(key);
}

/**
 * Decorator/wrapper for rate-limited async functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  action: string,
  fn: T,
  getIdentifier?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const identifier = getIdentifier ? getIdentifier(...args) : 'default';
    const { isLimited, retryAfter } = checkRateLimit(action, identifier);

    if (isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter || 60
      );
    }

    return fn(...args);
  };
}

/**
 * Custom error class for rate limit errors
 */
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Get rate limit status for display
 */
export function getRateLimitStatus(action: string, identifier: string = 'default'): {
  requestsUsed: number;
  maxRequests: number;
  windowMs: number;
  isBlocked: boolean;
  blockedUntil?: Date;
} {
  const config = RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.api;
  const key = `${action}:${identifier}`;
  const state = rateLimitStates.get(key);
  const now = Date.now();

  if (!state) {
    return {
      requestsUsed: 0,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      isBlocked: false,
    };
  }

  const validRequests = state.requests.filter(
    timestamp => now - timestamp < config.windowMs
  );

  return {
    requestsUsed: validRequests.length,
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
    isBlocked: state.blockedUntil > now,
    blockedUntil: state.blockedUntil > now ? new Date(state.blockedUntil) : undefined,
  };
}
