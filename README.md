# Deye Google Home Integration

A Google Home (Google Assistant) integration for Deye Cloud devices using the official Deye Cloud API.

## Features

- **Google Home Integration**: Control your Deye devices using Google Assistant voice commands
- **Cloud-to-Cloud**: Connects Google Home to Deye Cloud API for seamless device control
- **OAuth 2.0 Authentication**: Secure account linking between Google Home and Deye Cloud
- **Device Sync**: Automatically discover and sync all your Deye devices
- **Real-time Status**: Query and monitor device status through Google Home
- **Device Control**: Turn devices on/off and control settings via voice commands
- **Rate Limiting**: Built-in protection against API abuse with configurable rate limits

## Prerequisites

1. **Deye Cloud Account**: Register at [developer.deyecloud.com](https://developer.deyecloud.com)
2. **Deye Cloud API Credentials**: 
   - Create an application in the Deye Developer Portal
   - Obtain your `appId` and `appSecret`
3. **Google Home Developer Account**: Access [console.home.google.com](https://console.home.google.com)
4. **Node.js**: Version 14.0.0 or higher
5. **Public HTTPS Endpoint**: Required for Google Home fulfillment (use ngrok for testing)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/mawroos/DeyeGoogleHome.git
cd DeyeGoogleHome
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your credentials:
```env
# Deye Cloud API Configuration
DEYE_APP_ID=your_app_id_here
DEYE_APP_SECRET=your_app_secret_here
DEYE_EMAIL=your_deye_email@example.com
DEYE_PASSWORD=your_deye_password_here
DEYE_API_BASE_URL=https://eu1-developer.deyecloud.com

# OAuth Configuration for Google Home
OAUTH_CLIENT_ID=deye-google-home
OAUTH_CLIENT_SECRET=your_oauth_secret_here

# Server Configuration
PORT=3000
```

**Note**: Choose the correct `DEYE_API_BASE_URL` for your region:
- Europe/Asia-Pacific/Africa: `https://eu1-developer.deyecloud.com`
- Americas: `https://us1-developer.deyecloud.com`
- India: `https://india-developer.deyecloud.com`

## Usage

### Starting the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

### Testing the Connection

Test Deye Cloud authentication:
```bash
curl http://localhost:3000/test/auth
```

Test device list retrieval:
```bash
curl http://localhost:3000/test/devices
```

## Google Home Setup

### 1. Create a Project in Google Home Developer Console

1. Go to [console.home.google.com](https://console.home.google.com)
2. Click **Create Project**
3. Give it a name (e.g., "Deye Home")
4. Note the Project ID

### 2. Configure the Integration

1. In the Developer Console, go to **Develop** → **Configure**
2. Set up basic information:
   - **Integration name**: Deye
   - **Device types**: Select appropriate types for your Deye devices
   - **Upload app icon** (144x144 px)

### 3. Set Up Account Linking

Configure OAuth 2.0 settings:

- **Client ID**: `deye-google-home` (or your custom `OAUTH_CLIENT_ID`)
- **Client Secret**: Your `OAUTH_CLIENT_SECRET` from `.env`
- **Authorization URL**: `https://your-domain.com/auth/authorize`
- **Token Exchange URL**: `https://your-domain.com/auth/token`
- **Scopes**: `email` (optional)

### 4. Set Up Cloud Fulfillment

- **Cloud Fulfillment URL**: `https://your-domain.com/fulfillment`

### 5. Deploy to a Public HTTPS Endpoint

For testing, you can use ngrok:
```bash
ngrok http 3000
```

Use the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`) as your domain in the Google Home configuration.

### 6. Test Your Integration

1. Open Google Home app on your phone
2. Go to **Add** → **Set up device** → **Works with Google**
3. Search for your integration name
4. Link your account
5. Your Deye devices should appear in Google Home

## API Endpoints

### Health Check
- **GET** `/` - Returns service status

### OAuth Endpoints
- **GET** `/auth/authorize` - OAuth authorization endpoint
- **POST** `/auth/token` - OAuth token exchange endpoint

### Google Smart Home Fulfillment
- **POST** `/fulfillment` - Main fulfillment endpoint for Google Home

### Testing Endpoints (Development Only)
- **GET** `/test/auth` - Test Deye Cloud authentication
- **GET** `/test/devices` - List all Deye devices

## Supported Intents

The integration supports the following Google Smart Home intents:

- **SYNC**: Discover and sync devices from Deye Cloud
- **QUERY**: Get current status of devices
- **EXECUTE**: Control devices (on/off, mode changes, etc.)
- **DISCONNECT**: Handle account unlinking

## Supported Device Commands

- **OnOff**: Turn devices on/off
- Additional commands can be added based on device capabilities

## Architecture

```
Google Home App
      ↓
Google Assistant
      ↓
Google Smart Home API
      ↓
Your Server (this app)
      ├── OAuth Server (Account Linking)
      ├── Smart Home Handler (Intent Processing)
      └── Deye Cloud Client
            ↓
      Deye Cloud API
            ↓
      Your Deye Devices
```

## Security Notes

- Store your `.env` file securely and never commit it to version control
- Use strong, unique values for `OAUTH_CLIENT_SECRET`
- The Deye password is hashed using SHA256 before sending to the API
- Access tokens are managed automatically and renewed as needed

### Production Deployment Warning

⚠️ **IMPORTANT**: The current OAuth implementation uses in-memory token storage for simplicity. Before deploying to production:

1. **Replace In-Memory Storage**: Implement persistent storage for OAuth tokens using a database (Redis, PostgreSQL, MongoDB, etc.)
2. **Implement User Authentication**: The current OAuth flow auto-approves authorization requests. You must implement:
   - A proper login page to authenticate users
   - A consent screen showing what permissions are being granted
   - User approval flow before issuing authorization codes
3. **Enable HTTPS**: Google Home requires HTTPS endpoints in production
4. **Use Session Management**: Implement proper session handling for user authentication
5. **Review Rate Limiting**: The default rate limits (100 OAuth requests per 15 min, 60 fulfillment requests per minute) may need adjustment based on your usage patterns
6. **Monitor Token Expiry**: Implement proper token cleanup and renewal strategies

The current implementation is designed for development and testing purposes only.

## Troubleshooting

### Authentication Issues
- Verify your Deye credentials are correct
- Check that you're using the correct API base URL for your region
- Ensure your Deye Cloud application is active

### Device Not Appearing in Google Home
- Check that devices are visible in Deye Cloud app
- Try unlinking and relinking your account in Google Home
- Check server logs for any errors during SYNC
- Verify device mapping in `mapDeyeDeviceToGoogle()` supports your device type

### Command Execution Failures
- Verify device IDs are correct
- Check device status in Deye Cloud app
- Review server logs for API errors
- **Important**: Work mode values (0/1) may vary by device type - consult Deye API documentation for your specific device model

## Development

### Project Structure
```
.
├── src/
│   ├── deyeClient.js          # Deye Cloud API client
│   ├── smartHomeHandler.js    # Google Smart Home intent handlers
│   ├── oauthServer.js          # OAuth 2.0 server implementation
│   └── server.js               # Express server and routes
├── .env.example                # Environment variables template
├── package.json                # Node.js dependencies
└── README.md                   # This file
```

### Adding New Device Types

To support additional Deye device types:

1. Update `mapDeyeDeviceToGoogle()` in `smartHomeHandler.js`
2. Add appropriate Google Smart Home device types and traits
3. Implement corresponding command handlers in `handleExecute()`

### Adding New Commands

To support additional commands:

1. Add the trait to the device in `mapDeyeDeviceToGoogle()`
2. Implement the command handler in `handleExecute()`
3. Use the appropriate Deye Cloud API endpoint for the action

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

MIT License - See LICENSE file for details

## Resources

- [Deye Cloud Developer Portal](https://developer.deyecloud.com)
- [Deye Cloud API Documentation](https://developer.deyecloud.com/api)
- [Google Smart Home Developer Guide](https://developers.home.google.com/cloud-to-cloud)
- [Google Home Developer Console](https://console.home.google.com)

## Support

For issues related to:
- **Deye Cloud API**: Contact Deye support or check their developer portal
- **Google Home Integration**: Check Google's Smart Home documentation
- **This Integration**: Open an issue on GitHub
