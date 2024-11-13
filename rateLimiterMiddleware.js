import TokenBucket from './TokenBucket.js';

const rateLimiter = new TokenBucket(5, 3, 3); // capacity: 5, refill: 3 token every 3s

export async function rateLimiterMiddleware(req, res, next) {
  const clientKey = req.ip;
  const { tokens, capacity, retryAfter } = await rateLimiter.handleRequest(clientKey);

  res.set('X-RateLimit-Limit', capacity);
  res.set('X-RateLimit-Remaining', tokens);
  if (retryAfter > 0) {
    res.set('X-RateLimit-Retry-After', retryAfter);
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  next();
}
