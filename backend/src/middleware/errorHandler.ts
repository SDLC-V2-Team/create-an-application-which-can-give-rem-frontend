import { Request, Response, NextFunction } from 'express';

function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err);

  if (err.code === 'P2025') {
    // Prisma record not found
    return res.status(404).json({ message: 'Reminder not found' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: 'Internal server error' });
}

export default errorHandler;
