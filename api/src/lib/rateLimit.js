const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;

export function requestClientKey(request) {
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const clientIp = forwardedFor.split(',', 1)[0].trim()
    || request.headers.get('x-azure-clientip')
    || 'unknown';
  return clientIp.slice(0, 128);
}

export function createRateLimiter({
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
  now = Date.now,
} = {}) {
  const requests = new Map();

  return {
    check(key) {
      const currentTime = now();
      const existing = requests.get(key);
      if (!existing || existing.resetAt <= currentTime) {
        requests.set(key, { count: 1, resetAt: currentTime + windowMs });
        return { allowed: true, retryAfterSeconds: 0 };
      }

      if (existing.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000)),
        };
      }

      existing.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

export const inquiryRateLimiter = createRateLimiter();
