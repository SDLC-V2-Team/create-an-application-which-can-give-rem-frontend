import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, Category } from '@prisma/client';
import { query, body, validationResult } from 'express-validator';

const prisma = new PrismaClient();
const router = Router();

// GET /api/reminders?category=work&userId=1
router.get(
  '/',
  [
    query('userId').optional().isInt({ min: 1 }).toInt(),
    query('category').optional().isIn(['birthdays', 'work', 'casual', 'other']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const category = req.query.category as Category | undefined;

      const where: any = {};
      if (userId) where.userId = userId;
      if (category) where.category = category;

      const reminders = await prisma.reminder.findMany({
        where,
        orderBy: { dueDate: 'asc' },
      });

      // Default null categories to 'other' for backward compatibility
      const mapped = reminders.map((r) => ({
        ...r,
        category: r.category || 'other',
      }));

      res.json(mapped);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/reminders
router.post(
  '/',
  [
    body('userId').isInt({ min: 1 }).withMessage('userId is required'),
    body('title').isString().notEmpty().withMessage('title is required'),
    body('description').optional().isString(),
    body('dueDate').optional().isISO8601().toDate(),
    body('category')
      .optional()
      .isIn(['birthdays', 'work', 'casual', 'other'])
      .withMessage('Invalid category'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, title, description, dueDate, category } = req.body;

      const reminder = await prisma.reminder.create({
        data: {
          userId,
          title,
          description,
          dueDate,
          category: category || 'other',
        },
      });

      res.status(201).json(reminder);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/reminders/:id
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('title').optional().isString().notEmpty(),
    body('description').optional().isString(),
    body('dueDate').optional().isISO8601().toDate(),
    body('category')
      .optional()
      .isIn(['birthdays', 'work', 'casual', 'other']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const id = Number(req.params.id);
      const { title, description, dueDate, category } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (category !== undefined) updateData.category = category;
      else updateData.category = 'other'; // default for update if not provided

      const reminder = await prisma.reminder.update({
        where: { id },
        data: updateData,
      });

      res.json(reminder);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/reminders/:id
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      await prisma.reminder.delete({ where: { id } });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
