# Reminder SPA Frontend

Single-page application for managing reminders.

## Setup

bash
npm install
npm run dev


The frontend runs on http://localhost:5173 and proxies API requests to http://localhost:4000.

## Build for production

bash
npm run build


## Features
- User login (JWT)
- Create reminders with title and due time
- View reminders and their status (notified/pending)
- Delete reminders
- Receive browser push notifications when reminders are due
