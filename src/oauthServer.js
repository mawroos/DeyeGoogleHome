const crypto = require('crypto');

class OAuthServer {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    
    // In-memory storage for tokens and authorization codes
    // In production, use a proper database
    this.authorizationCodes = new Map();
    this.accessTokens = new Map();
    this.refreshTokens = new Map();
  }

  /**
   * Generate random token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Handle authorization request
   * GET /auth/authorize?client_id=XXX&redirect_uri=XXX&state=XXX&response_type=code
   */
  handleAuthorize(req, res) {
    const { client_id, redirect_uri, state, response_type } = req.query;

    // Validate client_id
    if (client_id !== this.clientId) {
      return res.status(400).send('Invalid client_id');
    }

    // Validate response_type
    if (response_type !== 'code') {
      return res.status(400).send('Invalid response_type');
    }

    // In a real implementation, show a login page here
    // For simplicity, auto-approve and generate authorization code
    const authCode = this.generateToken();
    
    // Store authorization code with redirect_uri
    this.authorizationCodes.set(authCode, {
      clientId: client_id,
      redirectUri: redirect_uri,
      createdAt: Date.now(),
      userId: 'deye-user' // In production, this would be the authenticated user ID
    });

    // Redirect back to Google with authorization code
    const redirectUrl = `${redirect_uri}?code=${authCode}&state=${state}`;
    res.redirect(redirectUrl);
  }

  /**
   * Handle token request
   * POST /auth/token
   */
  handleToken(req, res) {
    const { grant_type, code, client_id, client_secret, refresh_token, redirect_uri } = req.body;

    // Validate client credentials
    if (client_id !== this.clientId || client_secret !== this.clientSecret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    if (grant_type === 'authorization_code') {
      // Exchange authorization code for access token
      const authData = this.authorizationCodes.get(code);
      
      if (!authData) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code'
        });
      }

      // Verify redirect_uri matches
      if (authData.redirectUri !== redirect_uri) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Redirect URI mismatch'
        });
      }

      // Check if code is expired (5 minutes)
      if (Date.now() - authData.createdAt > 5 * 60 * 1000) {
        this.authorizationCodes.delete(code);
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Authorization code expired'
        });
      }

      // Delete authorization code (one-time use)
      this.authorizationCodes.delete(code);

      // Generate tokens
      const accessToken = this.generateToken();
      const refreshToken = this.generateToken();

      // Store tokens
      this.accessTokens.set(accessToken, {
        userId: authData.userId,
        createdAt: Date.now()
      });

      this.refreshTokens.set(refreshToken, {
        userId: authData.userId,
        createdAt: Date.now()
      });

      // Return tokens
      return res.json({
        token_type: 'Bearer',
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600 // 1 hour
      });

    } else if (grant_type === 'refresh_token') {
      // Refresh access token
      const tokenData = this.refreshTokens.get(refresh_token);
      
      if (!tokenData) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const accessToken = this.generateToken();
      
      this.accessTokens.set(accessToken, {
        userId: tokenData.userId,
        createdAt: Date.now()
      });

      return res.json({
        token_type: 'Bearer',
        access_token: accessToken,
        expires_in: 3600
      });

    } else {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Grant type not supported'
      });
    }
  }

  /**
   * Verify access token
   */
  verifyToken(token) {
    const tokenData = this.accessTokens.get(token);
    
    if (!tokenData) {
      return null;
    }

    // Check if token is expired (1 hour)
    if (Date.now() - tokenData.createdAt > 60 * 60 * 1000) {
      this.accessTokens.delete(token);
      return null;
    }

    return tokenData;
  }

  /**
   * Middleware to verify OAuth token
   */
  authenticateMiddleware() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'unauthorized',
          error_description: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.substring(7);
      const tokenData = this.verifyToken(token);

      if (!tokenData) {
        return res.status(401).json({
          error: 'unauthorized',
          error_description: 'Invalid or expired token'
        });
      }

      req.userId = tokenData.userId;
      next();
    };
  }
}

module.exports = OAuthServer;
