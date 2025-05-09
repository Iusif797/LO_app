# LOApp

A React Native mobile application for interacting with the LO platform API.

## Overview

LOApp is a mobile client that allows users to authenticate with the LO API using OAuth2 PKCE flow and view their posts feed. Built with React Native and Expo, it provides a simple but robust interface for accessing LO content on mobile devices.

## Features

- OAuth2 authentication with PKCE flow
- Posts feed with infinite scrolling
- Token management
- Modern UI with responsive design

## Tech Stack

- React Native
- Expo
- TypeScript
- React Navigation
- Axios for API requests
- AsyncStorage for data persistence
- FlashList for optimized lists

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- LO API credentials

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/LOApp.git
   cd LOApp
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Update the LO API credentials in `src/services/api.ts`

   ```typescript
   const CLIENT_ID = 1; // Replace with your actual LO client ID
   ```

4. Start the development server

   ```
   npx expo start
   ```

5. Scan the QR code with the Expo Go app on your phone or run on a simulator

## Authentication

The app uses OAuth2 with PKCE (Proof Key for Code Exchange) for secure authentication:

1. User initiates the login process
2. A code challenge is generated
3. User is redirected to the LO authentication page
4. After successful authentication, user is redirected back with an authorization code
5. The app exchanges the code for an access token
6. The token is stored securely for future API calls

## Project Structure

```
LOApp/
├── src/
│   ├── components/     # UI components
│   │   ├── Auth/       # Authentication components
│   │   └── Posts/      # Post feed components
│   ├── navigation/     # Navigation configuration
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── app.json            # Expo configuration
└── README.md           # This file
```

## API Integration

The app integrates with the LO API:

- Authentication via `/auth` and `/identity/token` endpoints
- Posts feed via `/posts/feed/` endpoint

## Troubleshooting

### Authentication Issues

- Make sure your CLIENT_ID is correct and has the necessary permissions
- Check that the redirect URI matches what's configured in the LO platform
- Ensure the PKCE flow parameters are correctly formatted

### Build Issues

- Clear Expo caches with `expo start --clear`
- Update dependencies if you encounter version conflicts

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- LO Platform for the API
- The React Native and Expo communities for the excellent tooling
