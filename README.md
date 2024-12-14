# Campus Event Management System - Backend

This is the backend for the Campus Event Management System, providing RESTful API services for managing users and events.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. **Clone the repository**:   ```bash
   git clone https://github.com/yourusername/backend.git   ```

2. **Navigate to the project directory**:   ```bash
   cd backend   ```

3. **Install dependencies**:   ```bash
   npm install   ```

## Usage

To start the server, run:
bash
npm start

The server will run on `http://localhost:5000` by default.

## Environment Variables

Create a `.env` file in the root directory and add the following:

MONGO_URI=your_mongodb_uri
PORT=5000
JWT_SECRET=your_jwt_secret


## Dependencies

- **Express**: Web framework for Node.js
- **Mongoose**: MongoDB object modeling tool
- **Cors**: Middleware for enabling CORS
- **Dotenv**: Loads environment variables from a `.env` file
- **Bcryptjs**: Library to hash passwords
- **Jsonwebtoken**: For generating and verifying JWT tokens

## API Endpoints

### User Routes
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate user and get token

### Event Routes
- `GET /api/events/getEvents`: Retrieve all events with optional search and filter
- `GET /api/events/filtered`: Get filtered events by user preferences
- `GET /api/events/:id`: Get single event
- `POST /api/events/createEvent`: Create a new event (Admin only)
- `PUT /api/events/updateEvent/:id`: Update an event (Admin only)
- `DELETE /api/events/deleteEvent/:id`: Delete an event (Admin only)
- `POST /api/events/register/:id`: Register for an event
- `POST /api/events/unregister/:id`: Unregister from an event
- `GET /api/events/user/registered`: Get user's registered events


