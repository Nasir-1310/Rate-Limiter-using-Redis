import express from 'express';
import { rateLimiterMiddleware } from './rateLimiterMiddleware.js';

const app = express();

// Apply rate limiter middleware to all routes
app.use(rateLimiterMiddleware);

app.get('/', (req, res) => {
  res.send("Welcome to the rate-limited endpoint!");
});

app.get('/user', (req, res) => {
  res.send("Welcome to the rate-limited endpoint! HI i am Nasir Uddin");
});



app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
