# Reminder Application — Design Document

This document describes the current structure and architecture of the reminder application, consisting of a frontend single‑page application and a backend REST API, based solely on the provided repository skeleton.

---

## 1. Overview

The system is a **reminder management application** with a client‑server architecture.  
- The **frontend** (`client/`) is a React‑based single‑page application (SPA) that allows users to log in and manage reminders. It is built with Vite and TypeScript.  
- The **backend** (`service/`) is a monolithic REST API responsible for user authentication and reminder CRUD operations. It also includes a background job mechanism for sending push notifications. Data is persisted in a PostgreSQL database, accessed via Prisma ORM.

The frontend runs on `http://localhost:5173` (development) and proxies API requests to the backend on `http://localhost:4000`. The backend is started separately and listens on port 4000.

---

## 2. Modules / Components / Services

### 2.1 Frontend (`client/`)

The frontend code is organised under `client/src/`.

| Path | Description |
|------|-------------|
| `client/src/main.tsx` | Application entry point. Renders the root React component. |
| `client/src/App.tsx` | Root component; likely sets up routing and global state. |
| `client/src/pages/Login.tsx` | Login page component. |
| `client/src/pages/Reminders.tsx` | Reminders management page component. |
| `client/src/components/ReminderForm.tsx` | Form component for creating/editing a reminder. |
| `client/src/components/ReminderList.tsx` | List component for displaying reminders. |
| `client/src/hooks/useAuth.tsx` | Custom hook for authentication logic (JWT). |
| `client/src/services/api.ts` | API service module – abstracts HTTP calls to the backend. |
| `client/src/register-sw.ts` | Service worker registration script (PWA feature). |

#### Tests
Corresponding test files exist for each of the above (`App.test.tsx`, `ReminderForm.test.tsx`, `ReminderList.test.tsx`, `useAuth.test.tsx`, `Login.test.tsx`, `Reminders.test.tsx`, `main.test.tsx`).

#### Assets
- `client/public/manifest.json` – Web App Manifest for PWA.  
- `client/public/sw.js` – Service worker file (likely handles caching and push notifications).

#### Configuration
- `client/package.json` – Scripts: `dev` (vite), `build` (tsc + vite build), `preview`, `lint`. Dependencies are listed but not fully shown.  
- `client/tsconfig.json` – TypeScript config targetting ES2020, using ESNext modules, with bundler resolution.  
- `client/vite.config.ts` – Vite configuration (proxying API calls to port 4000).

### 2.2 Backend (`service/`)

The backend code is organised under `service/src/`.

| Path | Description |
|------|-------------|
| `service/src/server.ts` | Server entry point – starts the HTTP server. |
| `service/src/app.ts` | Express application setup – mounts middleware and routes. |
| `service/src/routes/auth.ts` | Route handler for authentication endpoints (register, login). |
| `service/src/routes/reminders.ts` | Route handler for reminder CRUD endpoints. |
| `service/src/middleware/auth.ts` | Authentication middleware (JWT verification). |
| `service/src/db/prisma.ts` | Prisma client instance. |
| `service/src/services/background.ts` | Background job service (likely runs periodic tasks). |
| `service/src/services/push.ts` | Push notification service (sends notifications to clients). |

#### Database / ORM
- `service/prisma/schema.prisma` – Prisma schema defining the data model.  
  - **Model `User`**:  
    - `id` – Int, auto‑increment, primary key.  
    - `username` – String, unique.  
    - `password` – String.  
    - `reminders` – Relation to `Reminder[]` (one‑to‑many).  
  - **Model `Reminder`**: The skeleton references `Reminder[]` but does not include its field definitions. The model exists and is related to `User`.  
- Database provider: PostgreSQL (`postgresql`).  
- Migrations are run via `prisma migrate dev` (from `npm run migrate`).

#### Configuration
- `service/package.json` – Scripts: `dev` (ts‑node‑dev), `build` (tsc), `start` (node dist/server.js), `migrate` (prisma migrate), `seed` (ts‑node).  
- `service/tsconfig.json` – TypeScript config targetting ES2020, using CommonJS modules.  
- `.env` (referenced in README) – Holds environment variables such as `DATABASE_URL`.

---

## 3. Key Entities / Data Models

Based on the Prisma schema (partial):

### User
- `id` – Integer, auto‑incremented primary key.  
- `username` – String, unique.  
- `password` – String (hashed, presumably).  
- `reminders` – One‑to‑many relation to `Reminder`.

### Reminder
- Existence is implied by the relation `Reminder[]` in the `User` model. Its exact fields are not present in the skeleton (e.g., `title`, `description`, `dueDate`, `userId` are typical but not confirmed).  
- The relation indicates a foreign key `userId` on the `Reminder` table.

No other entities (e.g., push subscriptions) are visible in the skeleton.

---

## 4. Entry Points, APIs, and Data Flow

### 4.1 API Endpoints

Based on the service README and route files:

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST   | `/api/auth/register` | Create a new user and return a JWT. | No |
| (others) | `/api/auth/login` | Log in and obtain a JWT. | No (inferred from auth route) |
| CRUD   | `/api/reminders` | Reminder operations (likely GET, POST, PUT, DELETE). | Yes (JWT) |

The exact endpoints for reminders are not fully enumerated, but the route file `reminders.ts` handles CRUD.

### 4.2 Frontend Routes

- `/login` – Rendered by `Login.tsx`.  
- `/reminders` – Rendered by `Reminders.tsx`.  
- (other routes may exist but are not explicit in the skeleton)

### 4.3 Authentication Flow

1. User registers or logs in via `POST /api/auth/register` or `POST /api/auth/login`.  
2. Backend returns a JWT.  
3. Frontend stores the token (probably in `useAuth` hook) and attaches it to subsequent API calls.  
4. Backend middleware (`auth.ts`) verifies the token on protected routes.

### 4.4 Data Flow (Typical Interaction)

- Frontend pages/components call functions from `api.ts`.  
- `api.ts` sends HTTP requests to the backend (proxied in development to `localhost:4000`).  
- Backend routes (`auth.ts`, `reminders.ts`) process requests, use Prisma to interact with PostgreSQL, and return JSON responses.  
- For push notifications, the backend has a background job (`background.ts`) that may check for due reminders and trigger pushes via `push.ts`. The frontend service worker (`sw.js`) likely handles receiving push events.

### 4.5 Background Job

The file `service/src/services/background.ts` suggests a scheduled or persistent process (e.g., polling for reminders that are due). It probably uses the push service (`push.ts`) to send notifications to registered devices.

---

## 5. Tech Stack and Architectural Patterns

### 5.1 Frontend

- **Language**: TypeScript (ES2020 target).  
- **Framework/Library**: React (inferred from SPA nature and file structure).  
- **Build tool**: Vite.  
- **Testing**: Tests are present (`.test.tsx`), but testing framework is not specified (likely Jest / Vitest).  
- **PWA**: Service worker and Web App Manifest indicate Progressive Web App support for offline caching and push notifications.  
- **State management**: Not explicitly visible; likely uses React hooks and context (as seen with `useAuth`).

### 5.2 Backend

- **Language**: TypeScript (ES2020 target, CommonJS modules).  
- **Runtime**: Node.js.  
- **Web framework**: Express (inferred from middleware and route files, plus common patterns).  
- **ORM**: Prisma (`prisma-client-js`) with PostgreSQL.  
- **Authentication**: JWT (JSON Web Tokens).  
- **Background processing**: Custom script (`background.ts`) – no external job queue is apparent.  
- **Push notifications**: Custom service (`push.ts`) – likely uses Web Push API.  
- **Development runner**: `ts-node-dev` for hot‑reloading.

### 5.3 Architectural Patterns

- **Monolithic backend**: The API, authentication, reminders, and background job are all in one service.  
- **Client‑server separation**: Frontend and backend are independent projects with a clear API boundary.  
- **RESTful API**: The backend exposes REST endpoints for user and reminder management.  
- **JWT‑based stateless authentication**: Tokens are issued on registration/login and verified per request.  
- **Prisma as data access layer**: All database interactions go through Prisma.  
- **Background job within the same process**: The background service runs as part of the Node.js process (likely started in `server.ts`).  

No additional architectural patterns (e.g., microservices, event sourcing, CQRS) are discernible from the skeleton.