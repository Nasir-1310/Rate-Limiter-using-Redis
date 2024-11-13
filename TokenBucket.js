import Redis from 'ioredis';

export default class TokenBucket {
  constructor(capacity, refillAmount, refillTime) {
    this.capacity = capacity;
    this.refillAmount = refillAmount;
    this.refillTime = refillTime;
    this.redis = new Redis();

    // Lua script for token consumption and refill
    this.luaScript = `
      local bucket_key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_amount = tonumber(ARGV[2])
      local refill_time = tonumber(ARGV[3])
      local current_time = tonumber(ARGV[4])

      -- Fetch existing bucket
      local bucket = redis.call("GET", bucket_key)
      local tokens = capacity
      local last_ts = current_time

      if bucket then
        bucket = cjson.decode(bucket)
        tokens = tonumber(bucket.tokens)
        last_ts = tonumber(bucket.ts)

        -- Calculate elapsed time and tokens to refill
        local elapsed_time = math.floor((current_time - last_ts) / refill_time)
        tokens = math.min(capacity, tokens + elapsed_time * refill_amount)
      end

      if tokens > 0 then
        tokens = tokens - 1
        redis.call("SET", bucket_key, cjson.encode({tokens=tokens, ts=current_time}))
        return {tokens, capacity, 0}
      else
        local retry_after = refill_time - math.floor((current_time - last_ts) / 1000)
        return {tokens, capacity, retry_after}
      end
    `;
  }

  async handleRequest(key) {
    const currentTime = Date.now();
    const [tokens, capacity, retryAfter] = await this.redis.eval(
      this.luaScript,
      1,
      key,
      this.capacity,
      this.refillAmount,
      this.refillTime * 1000,
      currentTime
    );

    return { tokens, capacity, retryAfter };
  }
}
