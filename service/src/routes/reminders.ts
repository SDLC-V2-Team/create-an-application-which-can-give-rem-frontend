import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../db/prisma';

const router = Router();

router.use(authenticate);

// GET /api/reminders
router.get('/', async (req: AuthRequest, res) => {
  const reminders = await prisma.reminder.findMany({
    where: { userId: req.userId },
    orderBy: { dueTime: 'asc' },
  });
  res.json(reminders);
});

// POST /api/reminders
router.post('/', async (req: AuthRequest, res) => {
  const { title, due_time } = req.body;
  const reminder = await prisma.reminder.create({
    data: {
      title,
      dueTime: new Date(due_time),
      userId: req.userId!,
    },
  });
  res.status(201).json(reminder);
});

// DELETE /api/reminders/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || reminder.userId !== req.userId) {
    return res.status(404).json({ message: 'Reminder not found' });
  }
  await prisma.reminder.delete({ where: { id } });
  res.status(204).send();
});

export default router;
