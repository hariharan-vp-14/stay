# Backend API

A Node.js/Express backend for user authentication with JWT and MongoDB.

## Features
- User Registration & Login
- JWT Authentication
- Refresh Tokens
- Password Hashing
- Input Validation
- Error Handling

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/yourdb
JWT_SECRET=your_super_secret_jwt_key_2024_production
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Running the Server

```bash
# Development with Nodemon
npm run dev

# Production
npm start
```

## API Routes

### User Routes

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (requires auth)
- `POST /api/users/refresh` - Refresh access token
- `GET /api/users/logout` - Logout user

## Project Structure

```
backend/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── db/              # Database schemas & models
├── middleware/      # Express middleware
├── models/          # MongoDB models
├── routes/          # Route definitions
├── services/        # Business logic services
├── utils/           # Utility functions
├── app.js           # Express app configuration
├── server.js        # Server entry point
├── .env             # Environment variables
└── package.json     # Dependencies
```
