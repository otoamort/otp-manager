# OTP Manager Pro - User Guide

## Introduction

OTP Manager Pro is a secure and user-friendly application for managing and generating One-Time Passwords (OTP) for your online accounts. This guide will help you understand how to use the application effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Adding OTP Configurations](#adding-otp-configurations)
3. [Managing OTP Configurations](#managing-otp-configurations)
4. [Using OTP Codes](#using-otp-codes)
5. [Importing and Exporting](#importing-and-exporting)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

## Getting Started

OTP Manager Pro runs in your web browser. To get started:

1. Open the application in your web browser
2. You'll see the main dashboard, which will be empty if you're using the application for the first time
3. The application stores all data locally in your browser, so your OTP secrets never leave your device

## Adding OTP Configurations

There are several ways to add a new OTP configuration:

### Method 1: Manual Entry

1. Click the "Add Configuration" button in the top-right corner
2. Enter the following information:
   - **Account Name**: A name to identify this account (e.g., "Gmail" or "GitHub")
   - **Secret Key**: The secret key provided by the service you're setting up 2FA for
   - **Prefix** (optional): Text to add before the OTP code
   - **Postfix** (optional): Text to add after the OTP code
3. Click "Save Configuration"

### Method 2: Scan QR Code

1. Click the "Add Configuration" button
2. Click "Scan QR Code"
3. Allow camera access when prompted
4. Point your camera at the QR code shown by the service you're setting up 2FA for
5. The application will automatically extract the account name and secret key
6. Add any optional prefix or postfix
7. Click "Save Configuration"

### Method 3: Upload QR Code Image

1. Click the "Add Configuration" button
2. Click "Upload QR Code"
3. Select an image file containing the QR code
4. The application will automatically extract the account name and secret key
5. Add any optional prefix or postfix
6. Click "Save Configuration"

## Managing OTP Configurations

### Editing a Configuration

1. Find the configuration you want to edit
2. Click the edit (pencil) icon
3. Update the information as needed
4. Click "Save Configuration"

### Deleting a Configuration

1. Find the configuration you want to delete
2. Click the delete (trash) icon
3. The configuration will be immediately removed

## Using OTP Codes

### Viewing OTP Codes

Each configuration card shows:
- The account name
- The current OTP code (hidden by default)
- A countdown timer showing when the code will expire

### Showing/Hiding OTP Codes

- Click the "Show OTP" button to reveal the code
- Click "Hide OTP" to hide it again for security

### Copying OTP Codes

1. Find the configuration for which you need an OTP code
2. Click the copy (clipboard) icon
3. The current OTP code will be copied to your clipboard
4. A notification will confirm the code has been copied

### Refreshing OTP Codes

- OTP codes automatically refresh every 30 seconds
- You can manually refresh a code by clicking the refresh icon
- This will generate a new code and copy it to your clipboard

## Importing and Exporting

### Exporting Configurations

1. Click the "Export" button in the top-right corner
2. A JSON file containing all your configurations will be downloaded
3. Store this file securely as it contains sensitive information

### Importing Configurations

1. Click the "Import" button in the top-right corner
2. Select the previously exported JSON file
3. All configurations from the file will be imported
4. Note: This will not delete existing configurations

## Security Considerations

- **Local Storage**: All data is stored locally in your browser
- **Password Protection**: Consider using a password manager to protect access to the application
- **Regular Backups**: Export your configurations regularly to prevent data loss
- **Device Security**: Ensure your device is secured with a password or biometric authentication

## Troubleshooting

### OTP Codes Not Working

- Verify that the secret key was entered correctly
- Check that your device's time is synchronized correctly
- Try refreshing the OTP code

### Camera Not Working

- Ensure you've granted camera permissions to the application
- Try using the "Upload QR Code" option instead

### Import/Export Issues

- Make sure you're using a file previously exported from OTP Manager Pro
- Check that the file hasn't been modified or corrupted

For additional help or to report issues, please refer to the project's GitHub repository.