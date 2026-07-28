import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import reminderRoutes from './routes/reminders';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);

export default app;
