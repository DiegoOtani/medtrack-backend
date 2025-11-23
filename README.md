# MedTrack Backend

A robust Node.js/Express backend for medication tracking and management. MedTrack helps users organize medications, set reminders, track adherence, and manage medication inventory with push notifications.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

## Features

- **User Management**: Registration, login, authentication with JWT tokens
- **Medication Tracking**: Create, update, and manage medications with detailed information
- **Scheduling**: Automatic schedule generation based on medication frequency
- **Push Notifications**: Integration with Expo Push Notifications for medication reminders
- **Medication History**: Track when medications are taken, skipped, or missed
- **Adherence Statistics**: Calculate medication adherence rates over time
- **Stock Management**: Monitor medication stock levels and receive low-stock alerts
- **Reminder Settings**: Customize notification preferences and quiet hours
- **Rate Limiting**: Protection against abuse with configurable limits
- **Structured Logging**: Comprehensive logging for debugging and monitoring

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js 5
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest with Supertest
- **Documentation**: Swagger/OpenAPI with JSDoc
- **Notifications**: Expo Push Notifications
- **Validation**: Zod
- **Password Hashing**: Bcrypt

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **MongoDB** running locally or a MongoDB Atlas account (cloud)
- **Git** for version control

Verify installations:
```bash
node --version
npm --version
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/medtrack-backend.git
cd medtrack-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and update it with your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This creates the database schema and generates the Prisma client.

### 6. Seed the Database (Optional)

Populate the database with sample data for testing:

```bash
npm run seed
```

This creates:
- Test user: `teste@medtrack.com` / password: `senha123`
- Sample medications: Paracetamol and Ibuprofeno
- Pre-configured schedules

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/medtrack?retryWrites=true&w=majority"

# JWT Configuration
JWT_SECRET="your-super-secret-key-min-32-chars-recommended"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="development"

# Expo Push Notifications
EXPO_PUBLIC_API_URL="http://localhost:3000/api"
EXPO_PUBLIC_USE_MOCK_API="false"

# Optional: Rate Limiting (defaults provided)
# RATE_LIMIT_WINDOW_MS=900000
# RATE_LIMIT_MAX_REQUESTS=100
```

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for signing JWT tokens (use strong, random value) | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d`, `24h`, `1w` |
| `PORT` | Port the server runs on | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `EXPO_PUBLIC_API_URL` | Frontend API endpoint URL | `http://localhost:3000/api` |
| `EXPO_PUBLIC_USE_MOCK_API` | Use mock data instead of real API | `false` |

### Generating a Strong JWT Secret

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Using your terminal
head -c 32 /dev/urandom | base64
```

## Running the Application

### Development Mode

Run with hot reload using `ts-node-dev`:

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### Production Build

Build TypeScript to JavaScript:

```bash
npm run build
```

Start the built application:

```bash
npm start
```

### Watch Mode (without hot reload)

```bash
npm run build -- --watch
```

## Project Structure

```
medtrack-backend/
├── src/
│   ├── modules/
│   │   ├── users/              # User authentication & management
│   │   ├── medications/        # Medication CRUD operations
│   │   ├── schedules/          # Medication scheduling logic
│   │   ├── history/            # Medication usage history
│   │   └── notifications/      # Push notification management
│   ├── jobs/                   # Background jobs (notification sender)
│   ├── shared/
│   │   ├── middlewares/        # Auth, validation, rate limiting
│   │   ├── utils/              # JWT, logging utilities
│   │   └── lib/                # Prisma client
│   ├── swagger/                # Swagger/OpenAPI configuration
│   ├── app.ts                  # Express app setup
│   ├── server.ts               # Server entry point
│   └── routes.ts               # Main router configuration
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seeding script
├── tests/
│   ├── helpers.ts              # Test utilities
│   ├── mocks/                  # Mock configurations
│   └── setup.ts                # Jest setup
├── .env.example                # Environment variables template
├── jest.config.js              # Jest testing configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

## API Documentation

### Access Swagger Documentation

Once the server is running, visit:

```
http://localhost:3000/docs
```

### Main API Endpoints

#### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user

#### Medications
- `GET /api/medications` - List all medications
- `POST /api/medications` - Create medication
- `GET /api/medications/:id` - Get medication details
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication
- `GET /api/medications/today` - Get today's medications
- `GET /api/medications/stock/low` - Get low-stock medications

#### Medication History
- `GET /api/history/me` - Get user's history
- `POST /api/history` - Create history entry
- `GET /api/history/medication/:id/adherence` - Get adherence stats

#### Schedules
- `GET /api/schedules/medication/:id` - Get schedules for medication
- `POST /api/schedules` - Create custom schedule
- `PATCH /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

#### Notifications
- `POST /api/notifications/register-device` - Register device token
- `GET /api/notifications/settings` - Get notification settings
- `PUT /api/notifications/settings` - Update notification settings

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

View coverage report in `coverage/` directory.

### Run Specific Test Suite

```bash
npm test -- user.test.ts
npm test -- medication.test.ts
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

## Database Schema

### Core Models

**User**
- Stores user account information
- Relationships: medications, reminder settings, device tokens

**Medication**
- Medication details (name, dosage, frequency, expiration)
- Relationships: user, schedules, history

**MedicationSchedule**
- When and how often to take a medication
- Days of week and time for administration

**MedicationHistory**
- Records of medication actions (taken, skipped, missed)
- Tracks adherence and stock changes

**ReminderSettings**
- User notification preferences
- Quiet hours configuration

**DeviceToken**
- Expo push notification tokens
- Platform information (iOS/Android)

**ScheduledNotification**
- Push notifications queued for delivery
- Status tracking (scheduled, sent, failed)

## Deployment

### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET="your-secret" \
  DATABASE_URL="your-mongo-url" \
  NODE_ENV="production"

# Deploy
git push heroku main
```

### Deploy to Vercel

MedTrack Backend can be deployed as a Vercel serverless function. See Vercel documentation for detailed setup.

### Deploy to AWS Lambda

Use AWS SAM or Serverless Framework with the provided TypeScript configuration.

### Docker Deployment

```bash
# Build Docker image
docker build -t medtrack-backend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-mongo-url" \
  -e JWT_SECRET="your-secret" \
  medtrack-backend
```

## Development Workflow

### Pre-commit Checks

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Run tests
npm test
```

### Database Management

```bash
# View Prisma Studio (GUI for database)
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (warning: deletes all data)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

## Troubleshooting

### Connection Issues

**MongoDB connection fails:**
- Verify `DATABASE_URL` is correct
- Check MongoDB is running (if local) or Atlas credentials
- Ensure IP is whitelisted in MongoDB Atlas

**Port already in use:**
```bash
# Change PORT in .env or use lsof to find process
lsof -i :3000
kill -9 <PID>
```

### Authentication Errors

**JWT token not working:**
- Verify `JWT_SECRET` matches across requests
- Check token expiration with `JWT_EXPIRES_IN`
- Ensure `Authorization: Bearer <token>` header format

### Database Errors

**Prisma migration conflicts:**
```bash
npx prisma migrate resolve --rolled-back
npx prisma migrate dev
```

## Performance Optimization

- **Caching**: Implemented for GET requests (5-minute cache)
- **Compression**: Gzip compression enabled for responses
- **Rate Limiting**: Tiered limits (auth: 5/15min, general: 100/15min)
- **Database Indexing**: Indexes on frequently queried fields
- **Background Jobs**: Notification sender runs every minute

## Security Considerations

- JWT tokens expire automatically
- Passwords are hashed with bcrypt (10 rounds)
- SQL injection prevention via Prisma ORM
- CORS configured for cross-origin requests
- Rate limiting prevents brute force attacks
- Input validation with Zod schemas

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## License

This project is licensed under the ISC License - see LICENSE file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review Swagger API docs at `/docs` endpoint

## Changelog

### Version 1.0.0 (Initial Release)
- User authentication with JWT
- Complete medication management system
- Medication scheduling and notifications
- Adherence tracking and statistics
- Device token registration for push notifications
- Comprehensive API documentation
