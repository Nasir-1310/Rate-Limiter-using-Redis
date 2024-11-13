import express from 'express';
import { rateLimiterMiddleware } from './rateLimiterMiddleware.js';

const app = express();

// Apply rate limiter middleware to all routes
app.use(rateLimiterMiddleware);

app.get('/', (req, res) => {
  res.json({ message: "Welcome to the rate-limited endpoint!" });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
