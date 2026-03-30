# FinMate Backend API

This repository contains the backend server for **FinMate**, an AI-powered financial learning and management application. Built with Node.js, Express, and MongoDB, this API manages user profiles, financial syncing, and seamless OTP-based authentication.

## Technologies Used
- **Node.js** & **Express.js** - Robust routing and API architecture
- **MongoDB** & **Mongoose** - Cloud database for persisting user states, progress, and transactions
- **JSON Web Tokens (JWT)** - Secure, stateless session management
- **dotenv** - Environment variable parsing

## Features
- **OTP Authentication**: Generate and verify One-Time Passwords for frictionless, passwordless login.
- **Data Synchronization**: The `/sync` endpoint accepts multi-faceted state objects from the mobile app, securely merging local changes (budgets, transactions, progress maps) into the cloud.
- **Profile Management**: Retrieve and update user profiles on the fly.

## Getting Started

### Prerequisites
- Node.js (v16.x or strictly compatible LTS recommended)
- MongoDB instance (local or Atlas)

### Installation
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file in the root directory based on `.env.example`. Ensure the following keys are provided:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### Running the Server
You can start the server in development mode (if nodemon is installed) or standard start:
```bash
npm run dev
# OR
npm start
```
By default, the server will operate on `http://localhost:5000`.

## API Endpoints Overview
- `POST /api/users/send-otp` - Trigger an OTP to the user's phone number.
- `POST /api/users/verify-otp` - Validate the OTP and return a JWT.
- `GET /api/users/me` - Fetch the authenticated user's current cloud state.
- `POST /api/users/sync` - Overwrite/merge progress, transactions, and budgets.
- `PUT /api/users/profile` - Update profile aesthetics (e.g., Name).
