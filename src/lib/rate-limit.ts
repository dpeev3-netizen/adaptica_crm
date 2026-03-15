import IORedis from "ioredis";
import { RateLimitError } from "./api-error";

// A basic rate-limiter using IORedis (can be replaced with Upstash in serverless Next.js edge environments)
const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, window: 60 }
) {
  const key = `ratelimit:${identifier}`;
  
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, config.window);
  
  const results = await pipeline.exec();
  
  if (!results) {
    throw new Error("Redis pipeline failed");
  }

  const currentCount = results[0][1] as number;

  if (currentCount > config.limit) {
    throw new RateLimitError();
  }

  return {
    limit: config.limit,
    remaining: Math.max(0, config.limit - currentCount),
    success: true,
  };
}
