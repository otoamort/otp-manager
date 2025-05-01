# OTP Manager Pro

A secure and user-friendly application for managing and generating One-Time Passwords (OTP) for your online accounts.

## Project Description

OTP Manager Pro is a Next.js application designed to help users securely manage their two-factor authentication (2FA) tokens. It allows you to store, organize, and quickly generate OTP codes for your various online accounts, eliminating the need to switch between multiple authenticator apps.

## Features

- **Manage Multiple OTP Configurations**: Add, edit, and delete OTP configurations for different accounts
- **Real-time OTP Generation**: Automatically generates OTP codes with countdown timers
- **QR Code Support**: Scan QR codes directly or upload QR code images to add new configurations
- **Import/Export Functionality**: Easily backup and restore your OTP configurations
- **Copy to Clipboard**: One-click copy of OTP codes to clipboard
- **Prefix/Postfix Support**: Add custom text before or after the OTP code
- **Local Storage**: All data is stored locally in your browser for enhanced privacy

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/otp-manager.git
cd otp-manager

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage Guide

1. **Adding a New OTP Configuration**:
   - Click the "Add Configuration" button
   - Enter the account name and secret key
   - Optionally add prefix/postfix
   - Click "Save Configuration"

2. **Generating and Using OTP Codes**:
   - OTP codes are automatically generated and displayed for each configuration
   - Click the copy button to copy the code to your clipboard
   - Use the refresh button to generate a new code if needed

3. **Scanning QR Codes**:
   - When adding a new configuration, click "Scan QR Code" to use your camera
   - Alternatively, click "Upload QR Code" to upload an image containing a QR code

4. **Importing/Exporting Configurations**:
   - Use the "Export" button to save your configurations to a JSON file
   - Use the "Import" button to restore configurations from a previously exported file

## Development Setup

```bash
# Install dependencies
npm install

# Copy the example environment variables file
cp .env.example .env

# Edit the .env file and add your API keys
# GOOGLE_GENAI_API_KEY is required for AI assistant features

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

The following environment variables can be configured in your `.env` file:

- `GOOGLE_GENAI_API_KEY`: (Required for AI features) Your Google Gemini API key for AI functionality
- `NODE_ENV`: (Optional) Set to 'development' or 'production', defaults to 'development'
- `PORT`: (Optional) Port for the development server, defaults to 3000

You can obtain a Google Gemini API key from [Google AI Studio](https://ai.google.dev/).

## Contributing Guidelines

Contributions to OTP Manager Pro are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests to ensure everything works
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
