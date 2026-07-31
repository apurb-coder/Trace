import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const createRedisInstance = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  });
};
// Create standard Redis client for general caching, state storage, and snaps
export const redisClient = createRedisInstance();
// Create dedicated Redis client for publishing pub/sub messages
export const redisPub = createRedisInstance();
// Create dedicated Redis client for subscribing to pub/sub channels
export const redisSub = createRedisInstance();

const attachLogging = (client, name) => {
  client.on('connect', () => {
    console.log(`[Redis] ${name} client successfully connected`);
  });

  client.on('error', (err) => {
    console.error(`[Redis Error] ${name} client encountered an error:`, err);
  });

  client.on('close', () => {
    console.warn(`[Redis Warn] ${name} client connection closed`);
  });
};

attachLogging(redisClient, 'Cache/Storage');
attachLogging(redisPub, 'Publisher');
attachLogging(redisSub, 'Subscriber');
