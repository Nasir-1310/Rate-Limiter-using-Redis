import chalk from 'chalk';
import Redis from 'ioredis';

export default class TokenBucket {
  constructor(capacity, refillAmount, refillTime) {
    this.capacity = capacity;      // Maximum tokens the bucket can hold
    this.refillTime = refillTime;  // Refill interval in seconds
    this.refillAmount = refillAmount; // Tokens to add per interval
    this.redis = new Redis();      // Initialize Redis connection
  }

  async refillBucket(key) {
    // Retrieve current token data from Redis
    const data = await this.redis.get(key);
    const currentTime = Date.now();

    let tokens = this.capacity;
    let ts = currentTime;

    if (data) {
      const bucket = JSON.parse(data);
      tokens = bucket.tokens;
      ts = bucket.ts;

      // Calculate elapsed time in intervals
      const elapsedTime = Math.floor((currentTime - ts) / (this.refillTime * 1000));
      const newTokens = elapsedTime * this.refillAmount;

      // Update token count and timestamp
      tokens = Math.min(this.capacity, tokens + newTokens);
      ts = currentTime;
    }

    // Save the updated bucket data to Redis
    await this.redis.set(
      key,
      JSON.stringify({ tokens, ts })
    );

    return { tokens, ts };
  }

  async createBucket(key) {
    const data = await this.redis.get(key);
    if (!data) {
      // Initialize a new bucket with full capacity if none exists
      await this.redis.set(
        key,
        JSON.stringify({
          tokens: this.capacity,
          ts: Date.now(),
        })
      );
    }
    // Return the bucket data
    return JSON.parse(await this.redis.get(key));
  }

  async handleRequest(key) {
    let bucket = await this.createBucket(key);
    const currentTime = Date.now();

    // Calculate time elapsed since the last update
    const elapsedTime = Math.floor((currentTime - bucket.ts) / 1000);

    // Refill bucket if enough time has passed
    if (elapsedTime >= this.refillTime) {
      bucket = await this.refillBucket(key);
    }

    // Process request
    if (bucket.tokens > 0) {
      console.log(
        chalk.green(
          `Request[ACCEPTED] for ${key} (tokens - ${bucket.tokens}) -- ${new Date().toLocaleTimeString()}`
        )
      );
      bucket.tokens -= 1;  // Deduct a token for the request

      // Save updated token count to Redis
      await this.redis.set(
        key,
        JSON.stringify({
          tokens: bucket.tokens,
          ts: bucket.ts
        })
      );
      return true;
    } else {
      console.log(
        chalk.red(
          `Request[REJECTED] for ${key} (tokens - ${bucket.tokens}) -- ${new Date().toLocaleTimeString()}`
        )
      );
      return false;
    }
  }
}
