import rateLimit from 'express-rate-limit';
import { rateLimitOptions } from '../config/security.js';

/**
 * Standard API rate limiter applied globally to all REST routes
 */
export const apiRateLimiter = rateLimit(rateLimitOptions);


