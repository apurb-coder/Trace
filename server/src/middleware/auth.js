import url from 'url';

/**
 * Extracts and validates auth tokens for HTTP routes.
 */
export const authenticateHttp = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate token (Placeholder for JWT verification logic e.g. jwt.verify)
    const decoded = verifyToken(token);
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
 * Handshake requests don't standardly support custom headers in browser APIs, so query parameters are often used.
 * 
 * @param {import('http').IncomingMessage} req 
 * @returns {object|null} Decoded user object if valid, null otherwise
 */
export const authenticateWebSocket = (req) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    
    // Try to extract token from query parameters first (browser standard for raw WebSockets)
    let token = parsedUrl.query.token;
    
    // Fallback: Try to extract token from Authorization header if client is non-browser (e.g. backend-to-backend)
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

    // Validate the token signature
    const decoded = verifyToken(token);
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

/**
 * Mock signature validation logic. In production, swap this with standard JWT verification:
 * return jwt.verify(token, process.env.JWT_SECRET);
 */
function verifyToken(token) {
  if (!token) return null;
  
  // For boilerplate safety, let's accept any non-empty token or validate custom mock pattern
  if (token === 'guest' || token.length > 5) {
    return {
      userId: `user_${Math.random().toString(36).substr(2, 9)}`,
      role: 'collaborator'
    };
  }
  return null;
}
