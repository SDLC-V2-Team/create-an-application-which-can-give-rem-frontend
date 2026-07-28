# Reminder Backend Service

Monolithic REST API for user authentication and reminder CRUD, with a background job for push notifications.

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Start the database: `docker compose up -d db` (or provide your own PostgreSQL).
3. Run migrations: `npm run migrate`
4. Start development: `npm run dev`

The API runs on http://localhost:4000.

## Endpoints

| Method | Path               | Description            | Auth Required |
|--------|--------------------|------------------------|---------------|
| POST   | /api/auth/register | Create user + JWT      | No            |
| POST   | /api/auth/login    | Login + JWT            | No            |
| GET    | /api/reminders     | List user's reminders  | Yes           |
| POST   | /api/reminders     | Create reminder        | Yes           |
| DELETE | /api/reminders/:id | Delete reminder        | Yes           |

## Background job

A cron job runs every 30 seconds to find due reminders and send push notifications (placeholder implementation).
