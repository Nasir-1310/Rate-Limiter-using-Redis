import TokenBucket from './TokenBucket.js';

const rateLimiter = new TokenBucket(5, 1, 5);  // Example configuration

export async function rateLimiterMiddleware(req, res, next) {
  const clientKey = req.ip;  // You could use req.headers['x-forwarded-for'] in production
  console.log(clientKey);
  const isAllowed = await rateLimiter.handleRequest(clientKey);
  if (isAllowed) {
    next(); // Proceed to the next middleware or route handler
  } else {
    res.status(429).json({ error: "Too many requests - please try again later" });
  }
}
