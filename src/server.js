require('dotenv').config();
const express = require('express');
const DeyeCloudClient = require('./deyeClient');
const GoogleSmartHomeHandler = require('./smartHomeHandler');
const OAuthServer = require('./oauthServer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Deye Cloud Client
const deyeClient = new DeyeCloudClient(
  process.env.DEYE_APP_ID,
  process.env.DEYE_APP_SECRET,
  process.env.DEYE_EMAIL,
  process.env.DEYE_PASSWORD,
  process.env.DEYE_API_BASE_URL || 'https://eu1-developer.deyecloud.com'
);

// Initialize Google Smart Home Handler
const smartHomeHandler = new GoogleSmartHomeHandler(deyeClient);

// Initialize OAuth Server
const oauthServer = new OAuthServer(
  process.env.OAUTH_CLIENT_ID || 'deye-google-home',
  process.env.OAUTH_CLIENT_SECRET || 'default-secret'
);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Deye Google Home Integration',
    version: '1.0.0'
  });
});

// OAuth endpoints for Google Home account linking
app.get('/auth/authorize', (req, res) => {
  oauthServer.handleAuthorize(req, res);
});

app.post('/auth/token', (req, res) => {
  oauthServer.handleToken(req, res);
});

// Google Smart Home fulfillment endpoint
app.post('/fulfillment', oauthServer.authenticateMiddleware(), async (req, res) => {
  try {
    const response = await smartHomeHandler.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    console.error('Error in fulfillment endpoint:', error);
    res.status(500).json({
      requestId: req.body.requestId,
      payload: {
        errorCode: 'hardError',
        debugString: error.message
      }
    });
  }
});

// Test endpoint to verify Deye connection (for development)
app.get('/test/devices', async (req, res) => {
  try {
    const devices = await deyeClient.getDeviceList();
    res.json({
      success: true,
      devices: devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to verify authentication (for development)
app.get('/test/auth', async (req, res) => {
  try {
    const token = await deyeClient.authenticate();
    res.json({
      success: true,
      message: 'Authentication successful',
      tokenLength: token.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Deye Google Home Integration server running on port ${PORT}`);
  console.log(`Fulfillment endpoint: http://localhost:${PORT}/fulfillment`);
  console.log(`OAuth authorize endpoint: http://localhost:${PORT}/auth/authorize`);
  console.log(`OAuth token endpoint: http://localhost:${PORT}/auth/token`);
});

module.exports = app;
