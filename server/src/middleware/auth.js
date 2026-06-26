import * as jose from 'jose';
import url from 'url';
import prisma from '../utils/prisma.js';

const jwksUrl = process.env.SUPABASE_JWKS_URL;
const jwtIssuer = process.env.SUPABASE_JWT_ISSUER;
const jwtAudience = process.env.SUPABASE_JWT_AUDIENCE || 'authenticated';

let JWKS;
try {
  if (jwksUrl) {
    JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
  }
} catch (error) {
  console.error('Failed to initialize JWKS remote set:', error.message);
}

/**
 * Validates token signature and syncs user metadata with database.
 */
export const verifyToken = async (token) => {
  if (!token) return null;

  // Fallback for local guest testing
  if (token === 'guest') {
    return {
      userId: 'guest-user',
      email: 'guest@trace.draw',
      role: 'collaborator'
    };
  }

  try {
    if (!JWKS) {
      const urlEnv = process.env.SUPABASE_JWKS_URL;
      if (urlEnv) {
        JWKS = jose.createRemoteJWKSet(new URL(urlEnv));
      } else {
        throw new Error('JWKS endpoint URL not set');
      }
    }

    const issuer = process.env.SUPABASE_JWT_ISSUER;
    const audience = process.env.SUPABASE_JWT_AUDIENCE || 'authenticated';

    const decoded = await jose.jwtVerify(token, JWKS, {
      issuer,
      audience,
    });

    const payload = decoded.payload;
    const id = payload.sub; // Supabase user ID UUID
    const email = payload.email || '';
    const role = payload.user_metadata?.role || 'USER';

    let user = await prisma.user.findUnique({ where: { id } });

    // Cache user reference record if not present
    if (!user) {
      user = await prisma.user.create({
        data: {
          id,
          email,
          role
        }
      });
    } else if (payload.user_metadata?.role && user.role !== role) {
      // Sync metadata update
      user = await prisma.user.update({
        where: { id },
        data: { role }
      });
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error('[verifyToken Error] Validation/DB Sync failed:', error.message);
    return null;
  }
};

/**
 * Extracts and validates auth tokens for HTTP routes.
 */
export const authenticateHttp = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token signature' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth HTTP Error]', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Extracts and validates auth tokens from the incoming HTTP request during the WebSocket upgrade handshake.
 */
export const authenticateWebSocket = async (req) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    
    // Try to extract token from query parameters first
    let token = parsedUrl.query.token;
    
    // Fallback: Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      console.warn('[Auth WS Warn] Attempted connection upgrade rejected: Missing credentials');
      return null;
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      console.warn('[Auth WS Warn] Attempted connection upgrade rejected: Invalid credentials');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('[Auth WS Error]', error);
    return null;
  }
};
