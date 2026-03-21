import { Queue } from "bullmq";
import Redis from "ioredis";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null }) as any;
export const defaultQueue = new Queue("default-queue", { connection: redisConnection });
