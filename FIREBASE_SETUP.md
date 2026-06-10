# Firebase Setup for Encanto App

This document explains how to set up Firebase Cloud Messaging (FCM) for push notifications in the Encanto app.

## Overview

The Firebase messaging service worker (`firebase-messaging-sw.js`) is now generated at build time using environment variables, keeping your Firebase configuration secrets safe and out of version control.

## Setup Steps

### 1. Environment Variables

Create a `.env.local` file in your project root with the following Firebase configuration:

```bash
# Copy from firebase-env.example
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Important**: All Firebase config values must be prefixed with `NEXT_PUBLIC_` to be accessible during the build process.

### 2. Build Process

The Firebase service worker is automatically generated when you run:

```bash
pnpm build
```

This runs the `prebuild` script which executes `scripts/generate-firebase-sw.js` to create the service worker with your environment variables.

### 3. Development

For development, you can manually generate the service worker:

```bash
node scripts/generate-firebase-sw.js
```

## How It Works

1. **Template**: The service worker template is stored in `scripts/generate-firebase-sw.js`
2. **Build Time**: During `pnpm build`, the `prebuild` script runs first
3. **Generation**: Environment variables are injected into the template
4. **Output**: The final `firebase-messaging-sw.js` is created in the `public/` directory

## Security Benefits

- ✅ Firebase configuration secrets are not committed to version control
- ✅ Each environment can have different Firebase configurations
- ✅ Build-time generation ensures the service worker is always up-to-date
- ✅ Environment variables can be securely managed in deployment platforms

## Troubleshooting

### Missing Environment Variables

If you see warnings about missing environment variables, check that:

- Your `.env.local` file exists and contains all required variables
- All variables are prefixed with `NEXT_PUBLIC_`
- The values are correct for your Firebase project

### Service Worker Not Generated

If the service worker isn't generated during build:

- Ensure the `prebuild` script is running before `next build`
- Check that `scripts/generate-firebase-sw.js` exists and is executable
- Verify your environment variables are loaded

### Firebase Not Initializing

If Firebase fails to initialize in the service worker:

- Check the browser console for error messages
- Verify the generated `firebase-messaging-sw.js` contains your actual config values
- Ensure your Firebase project is properly configured for FCM

## File Structure

```
├── scripts/
│   └── generate-firebase-sw.js    # Build script template
├── public/
│   └── firebase-messaging-sw.js   # Generated service worker (gitignored)
├── firebase-env.example           # Example environment variables
├── .env.local                     # Your actual environment variables
└── package.json                   # Contains prebuild script
```

## Deployment

When deploying to platforms like Vercel:

1. Set the environment variables in your deployment platform
2. The build process will automatically generate the service worker
3. The generated file will be served from the `public/` directory

## Notes

- The generated service worker is automatically added to `.gitignore`
- Never commit your `.env.local` file with real Firebase credentials
- The `prebuild` script runs automatically before `pnpm build`
- You can manually regenerate the service worker anytime by running the script directly
