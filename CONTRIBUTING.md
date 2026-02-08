# Contributing to Deye Google Home Integration

Thank you for considering contributing to this project! This guide will help you get started.

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Node.js version, OS, etc.)
- Relevant logs or error messages

### Suggesting Features

Feature requests are welcome! Please include:
- Use case and motivation
- Proposed solution or API
- Any alternatives considered

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/DeyeGoogleHome.git
cd DeyeGoogleHome

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

## Coding Guidelines

### JavaScript Style

- Use ES6+ features where appropriate
- Use `const` and `let`, avoid `var`
- Use async/await for asynchronous code
- Add meaningful comments for complex logic
- Keep functions focused and single-purpose

### Error Handling

- Always catch and handle errors appropriately
- Log errors with context
- Return user-friendly error messages
- Don't expose sensitive information in errors

### Security

- Never commit credentials or secrets
- Validate all user inputs
- Use parameterized queries/requests
- Follow OAuth 2.0 best practices
- Keep dependencies updated

## Project Structure

```
src/
├── deyeClient.js          # Deye Cloud API client
├── smartHomeHandler.js    # Google Smart Home intent handlers
├── oauthServer.js          # OAuth 2.0 implementation
└── server.js               # Express server and routes
```

## Adding New Features

### Adding a New Device Type

1. Update `mapDeyeDeviceToGoogle()` in `smartHomeHandler.js`
2. Add appropriate Google Smart Home device type and traits
3. Implement command handlers in `handleExecute()`
4. Test with actual devices
5. Update documentation

### Adding a New Command

1. Add trait to device in `mapDeyeDeviceToGoogle()`
2. Implement command handler in `handleExecute()`
3. Add corresponding Deye API call in `deyeClient.js`
4. Test thoroughly
5. Update documentation

### Adding a New Deye API Endpoint

1. Add method to `DeyeCloudClient` class in `deyeClient.js`
2. Use consistent error handling pattern
3. Ensure token validation with `getHeaders()`
4. Add JSDoc comments
5. Test with actual API

## Testing

### Manual Testing

Use the test endpoints:
```bash
# Test authentication
curl http://localhost:3000/test/auth

# Test device list
curl http://localhost:3000/test/devices
```

### Testing with Google Home

1. Deploy to a public HTTPS endpoint (use ngrok for testing)
2. Configure in Google Home Developer Console
3. Test in Google Home app
4. Try various voice commands

### Testing OAuth Flow

1. Access authorization URL in browser
2. Verify redirect with authorization code
3. Test token exchange
4. Verify token validation

## Documentation

When adding features:
- Update README.md with new capabilities
- Add examples to QUICKSTART.md if relevant
- Update inline code comments
- Document any new environment variables

## Commit Messages

Use clear, descriptive commit messages:

```
Add support for battery control commands

- Implement setBatteryMode in deyeClient
- Add battery control handler in smartHomeHandler
- Update documentation
```

## Release Process

Maintainers will:
1. Review and merge PRs
2. Update version in package.json
3. Tag releases
4. Update changelog

## Questions?

- Open a GitHub issue for questions
- Check existing issues and pull requests first
- Be patient and respectful

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
