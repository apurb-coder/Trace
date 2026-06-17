import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null, // Critical configuration when using Pub/Sub with ioredis
};

// Create standard Redis client for general caching, state storage, and snapshots
export const redisClient = new Redis(redisConfig);

// Create dedicated Redis client for publishing pub/sub messages
export const redisPub = new Redis(redisConfig);

// Create dedicated Redis client for subscribing to pub/sub channels
export const redisSub = new Redis(redisConfig);

// Helper to attach lifecycle logging to client instances
const attachLogging = (client, name) => {
  client.on('connect', () => {
    console.log(`[Redis] ${name} client successfully connected to redis://${redisConfig.host}:${redisConfig.port}`);
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
