# Reminder Categorization Project

This monorepo contains two services:
- **backend**: Node.js + Express + Prisma (PostgreSQL)
- **frontend**: React + Vite + TypeScript

## Getting Started

### Prerequisites
- Node.js >= 20
- Docker (optional)
- PostgreSQL database (or use Docker)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Edit DATABASE_URL
npx prisma migrate dev --name init
npm run prisma:seed	npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be at http://localhost:3000, proxying API calls to backend at http://localhost:4000.

### Docker Setup (both services)

```bash
# Build and run with docker-compose (create a docker-compose.yml if needed)
docker-compose up --build
```

## Architecture Decisions (ADRs)

See the ADR document for rationale behind using Prisma enums, client-side grouping, and API changes.

## Migration Details

The Prisma migration adds a `category` column to the `reminders` table with a default value of `'other'`. Backward compatibility ensures that existing reminders without a category are treated as 'other'.
