# Quick Start Guide

This guide will help you quickly set up and test the Deye Google Home integration.

## Step 1: Prerequisites

Ensure you have:
- Node.js 14+ installed
- A Deye Cloud account with API credentials (appId and appSecret)
- Your Deye Cloud account email and password

## Step 2: Installation

```bash
# Clone the repository
git clone https://github.com/mawroos/DeyeGoogleHome.git
cd DeyeGoogleHome

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

## Step 3: Configure

Edit `.env` file with your credentials:

```env
DEYE_APP_ID=your_app_id_here
DEYE_APP_SECRET=your_app_secret_here
DEYE_EMAIL=your_deye_email@example.com
DEYE_PASSWORD=your_actual_password
DEYE_API_BASE_URL=https://eu1-developer.deyecloud.com
OAUTH_CLIENT_ID=deye-google-home
OAUTH_CLIENT_SECRET=generate_random_secret_here
PORT=3000
```

**Important**: Use the correct API base URL for your region:
- Europe/Asia-Pacific/Africa: `https://eu1-developer.deyecloud.com`
- Americas: `https://us1-developer.deyecloud.com`
- India: `https://india-developer.deyecloud.com`

## Step 4: Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

## Step 5: Test Locally

Test authentication:
```bash
curl http://localhost:3000/test/auth
```

Expected response:
```json
{
  "success": true,
  "message": "Authentication successful",
  "tokenLength": 64
}
```

Test device listing:
```bash
curl http://localhost:3000/test/devices
```

## Step 6: Deploy (Required for Google Home)

Google Home requires a public HTTPS endpoint. Options:

### Option A: Using ngrok (for testing)
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000
```

Use the HTTPS URL provided (e.g., `https://abc123.ngrok.io`)

### Option B: Deploy to Cloud
- Heroku, AWS, Google Cloud, Azure, etc.
- Ensure SSL/HTTPS is enabled
- Set environment variables in your platform

## Step 7: Configure Google Home

1. Go to [console.home.google.com](https://console.home.google.com)
2. Create a new project
3. Navigate to **Develop** → **Configure**:
   - Integration name: Deye
   - Upload app icon (144x144 px)
4. **Account Linking** settings:
   - Client ID: `deye-google-home` (or your OAUTH_CLIENT_ID)
   - Client Secret: Your OAUTH_CLIENT_SECRET value
   - Authorization URL: `https://your-domain.com/auth/authorize`
   - Token URL: `https://your-domain.com/auth/token`
5. **Cloud Fulfillment**:
   - Fulfillment URL: `https://your-domain.com/fulfillment`
6. Save and test

## Step 8: Link Your Account

1. Open Google Home app on your phone
2. Tap **+** → **Set up device** → **Works with Google**
3. Search for your integration name
4. Complete the linking process
5. Your Deye devices should now appear!

## Troubleshooting

### Server won't start
- Check Node.js version: `node --version` (should be 14+)
- Verify `.env` file exists and has correct values
- Check if port 3000 is already in use

### Authentication fails
- Verify Deye credentials are correct
- Check API base URL matches your region
- Ensure your Deye app is active in the developer portal

### Devices not appearing
- Check `/test/devices` endpoint returns your devices
- Verify devices are visible in Deye Cloud app
- Try unlinking and relinking in Google Home app

### Commands not working
- Check server logs for errors
- Verify device IDs are correct
- Work mode values may need adjustment for your device type

## Voice Commands to Try

Once set up, try these commands with Google Assistant:
- "Hey Google, sync my devices"
- "Hey Google, turn on [device name]"
- "Hey Google, turn off [device name]"
- "Hey Google, is [device name] on?"

## Next Steps

- Review the full [README.md](README.md) for detailed documentation
- Customize device mappings in `src/smartHomeHandler.js`
- Add support for additional device types and commands
- Implement proper OAuth authentication for production

## Support

- Deye Cloud API issues: [developer.deyecloud.com](https://developer.deyecloud.com)
- Google Home issues: [developers.home.google.com](https://developers.home.google.com)
- Integration issues: Open a GitHub issue
