import rateLimit from 'express-rate-limit';
import { rateLimitOptions } from '../config/security.js';

/**
 * Standard API rate limiter applied globally to all REST routes
 */
export const apiRateLimiter = rateLimit(rateLimitOptions);

/**
 * Stricter rate limiter specifically for WebSocket connection handshakes to mitigate connection flooding
 */
export const wsHandshakeRateLimiter = rateLimit({
  ...rateLimitOptions,
  windowMs: 60000, // 1 minute window
  max: 10, // Limit each IP to 10 socket upgrade attempts per minute
  message: {
    status: 429,
    message: 'Too many socket connection requests from this IP. Please try again after a minute.'
  }
});
