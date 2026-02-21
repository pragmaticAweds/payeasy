import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function upstashGet (userId: string) {
    return await redis.get(`recommendations:${userId}`);
}

export async function upstashSet (userId: string, recommendations: any) {
    // Cache for 1 hour
    await redis.set(`recommendations:${userId}`, recommendations, { ex: 3600 });
}
