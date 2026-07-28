import request from 'supertest';
import express, { Router } from 'express';
import router from './reminders';

// Mock PrismaClient
const mockPrisma = {
  reminder: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Category: {
    birthdays: 'birthdays',
    work: 'work',
    casual: 'casual',
    other: 'other',
  },
}));

// Create test app using the router
const app = express();
app.use(express.json());
app.use('/api/reminders', router);

describe('Reminders Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all reminders with default category "other" for nulls', async () => {
      const mockReminders = [
        { id: 1, userId: 1, title: 'Reminder 1', category: 'work', dueDate: new Date() },
        { id: 2, userId: 2, title: 'Reminder 2', category: null, dueDate: new Date() },
      ];
      mockPrisma.reminder.findMany.mockResolvedValue(mockReminders);

      const res = await request(app).get('/api/reminders').expect(200);

      const expected = mockReminders.map(r => ({ ...r, category: r.category || 'other' }));
      expect(res.body).toEqual(expected.map(r => ({
        ...r,
        dueDate: r.dueDate.toISOString(),
      })));
      expect(mockPrisma.reminder.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { dueDate: 'asc' },
      });
    });

    it('should filter reminders by category', async () => {
      const mockReminders = [
        { id: 1, userId: 1, title: 'Work task', category: 'work', dueDate: new Date() },
      ];
      mockPrisma.reminder.findMany.mockResolvedValue(mockReminders);

      const res = await request(app)
        .get('/api/reminders?category=work')
        .expect(200);

      expect(res.body).toEqual(mockReminders.map(r => ({ ...r, dueDate: r.dueDate.toISOString() })));
      expect(mockPrisma.reminder.findMany).toHaveBeenCalledWith({
        where: { category: 'work' },
        orderBy: { dueDate: 'asc' },
      });
    });
  });

  describe('POST /', () => {
    it('should create a reminder and default category to "other" if not provided', async () => {
      const newReminder = {
        id: 3,
        userId: 1,
        title: 'New',
        description: null,
        dueDate: new Date(),
        category: 'other',
      };
      mockPrisma.reminder.create.mockResolvedValue(newReminder);

      const res = await request(app)
        .post('/api/reminders')
        .send({ userId: 1, title: 'New' })
        .expect(201);

      expect(res.body).toEqual({ ...newReminder, dueDate: newReminder.dueDate.toISOString() });
      expect(mockPrisma.reminder.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          title: 'New',
          description: undefined,
          dueDate: undefined,
          category: 'other',
        },
      });
    });

    it('should return 400 for invalid category', async () => {
      const res = await request(app)
        .post('/api/reminders')
        .send({ userId: 1, title: 'Test', category: 'invalid' })
        .expect(400);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].msg).toBe('Invalid category');
    });

    it('should return 400 if userId missing', async () => {
      const res = await request(app)
        .post('/api/reminders')
        .send({ title: 'No user' })
        .expect(400);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].msg).toBe('userId is required');
    });
  });

  describe('PUT /:id', () => {
    it('should update a reminder and default category to "other" if not provided', async () => {
      const updated = {
        id: 1,
        userId: 1,
        title: 'Updated',
        description: 'desc',
        dueDate: new Date(),
        category: 'other',
      };
      mockPrisma.reminder.update.mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/reminders/1')
        .send({ title: 'Updated', description: 'desc' })
        .expect(200);

      expect(res.body).toEqual({ ...updated, dueDate: updated.dueDate.toISOString() });
      expect(mockPrisma.reminder.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: 'Updated',
          description: 'desc',
          category: 'other', // defaulted because not provided
        },
      });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a reminder and return 204', async () => {
      mockPrisma.reminder.delete.mockResolvedValue(undefined);

      await request(app)
        .delete('/api/reminders/1')
        .expect(204);

      expect(mockPrisma.reminder.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});