import request from 'supertest';
import express from 'express';
import router from './reminders';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.userId = 1;
    next();
  },
}));

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    reminder: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import prisma from '../db/prisma';

const app = express();
app.use(express.json());
app.use(router);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Reminders API', () => {
  describe('GET /', () => {
    it('should return reminders for the authenticated user', async () => {
      const mockReminders = [
        { id: 1, title: 'Test', dueTime: new Date().toISOString(), userId: 1 },
      ];
      (prisma.reminder.findMany as jest.Mock).mockResolvedValue(mockReminders);

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockReminders);
      expect(prisma.reminder.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { dueTime: 'asc' },
      });
    });
  });

  describe('POST /', () => {
    it('should create a new reminder and return 201', async () => {
      const newReminder = {
        title: 'Test reminder',
        due_time: '2025-04-10T10:00:00Z',
      };
      const created = {
        id: 2,
        title: newReminder.title,
        dueTime: new Date(newReminder.due_time),
        userId: 1,
      };
      (prisma.reminder.create as jest.Mock).mockResolvedValue(created);

      const response = await request(app).post('/').send(newReminder);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(created);
      expect(prisma.reminder.create).toHaveBeenCalledWith({
        data: {
          title: newReminder.title,
          dueTime: new Date(newReminder.due_time),
          userId: 1,
        },
      });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete the reminder and return 204 if it belongs to the user', async () => {
      const mockReminder = { id: 1, userId: 1 };
      (prisma.reminder.findUnique as jest.Mock).mockResolvedValue(mockReminder);
      (prisma.reminder.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app).delete('/1');

      expect(response.status).toBe(204);
      expect(prisma.reminder.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return 404 if reminder does not exist', async () => {
      (prisma.reminder.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete('/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Reminder not found');
    });

    it('should return 404 if reminder belongs to another user', async () => {
      const mockReminder = { id: 1, userId: 2 };
      (prisma.reminder.findUnique as jest.Mock).mockResolvedValue(mockReminder);

      const response = await request(app).delete('/1');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Reminder not found');
    });
  });
});