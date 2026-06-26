import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { corsOptions, helmetOptions } from './config/security.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { getRoomSnapshot } from './services/redisService.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// 1. Attach Helmet for securing HTTP headers
app.use(helmet(helmetOptions));

// 2. Attach Cross-Origin Resource Sharing rules
app.use(cors(corsOptions));

// 3. Attach protection against HTTP Parameter Pollution attacks
app.use(hpp());

// 4. Parse incoming JSON body payloads with size limits to prevent buffer flooding
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Apply global API rate limits
app.use('/api', apiRateLimiter);

// 6. Mount authentication endpoints
app.use('/api/auth', authRoutes);

/**
 * REST Endpoint: Health check (useful for Nginx, Docker, Kubernetes or cloud probes)
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version
  });
});

/**
 * REST Endpoint: Retrieve current whiteboard snapshot via standard API (Optional / Debugging helper)
 */
app.get('/api/rooms/:roomId/snapshot', async (req, res) => {
  const { roomId } = req.params;
  try {
    const snapshot = await getRoomSnapshot(roomId);
    if (!snapshot) {
      return res.status(404).json({ error: 'Room snapshot not found or room inactive' });
    }
    return res.status(200).json(snapshot);
  } catch (error) {
    console.error(`[REST Error] Failed to get room snapshot for ${roomId}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Central error handling middleware
app.use((err, req, res, next) => {
  console.error('[Express Error Handler]', err);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

export default app;
