import Redis from 'ioredis';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 3000);
        return delay;
      },
    });
  }
  return redisInstance;
}

// Assessment job queue key — must match Go worker's QueueKey
export const ASSESSMENT_QUEUE_KEY = 'assessment:queue';

export interface AssessmentJob {
  executionId: string;
  auditOrderId: string;
  organizationId: string;
  targetId: string;
}

/**
 * Enqueue an assessment job for the Go assessment-worker to pick up via BRPOP.
 */
export async function enqueueAssessmentJob(job: AssessmentJob): Promise<void> {
  const redis = getRedis();
  await redis.lpush(ASSESSMENT_QUEUE_KEY, JSON.stringify(job));
}
