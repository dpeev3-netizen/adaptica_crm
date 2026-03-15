import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from './logger';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const defaultQueue = new Queue('default-queue', { connection });

// Generic worker initialization. 
// In an actual clustered deployment you would run workers in a separate process/container.
export const defaultWorker = new Worker(
  'default-queue',
  async (job) => {
    logger.info(`Processing job ${job.id} of type ${job.name}`);
    
    // Add business logic for specific job types here
    
    return { success: true };
  },
  { connection }
);

defaultWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} has completed!`);
});

defaultWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} has failed with ${err.message}`);
});
