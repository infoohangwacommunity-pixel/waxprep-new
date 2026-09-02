export function createRateLimiter(options = {}) {
  const { windowMs = 60000, maxRequests = 100 } = options;
  const requestCounts = new Map();
  function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const count = requestCounts.get(ip) || { count: 0, resetAt: now + windowMs };
    if (now > count.resetAt) { count.count = 0; count.resetAt = now + windowMs; }
    if (count.count >= maxRequests) return res.status(429).json({ error: 'Rate limit exceeded' });
    count.count++;
    requestCounts.set(ip, count);
    next();
  }
  return rateLimiter;
}
export default createRateLimiter;
