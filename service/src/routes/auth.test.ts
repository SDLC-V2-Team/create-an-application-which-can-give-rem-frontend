import request from 'supertest';
import express from 'express';
import authRouter from './auth';

jest.mock('../db/prisma', () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

import prisma from '../db/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(authRouter);

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /register', () => {
  it('should register a new user and return 201 with token', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: 'hashedpassword',
    });
    (jwt.sign as jest.Mock).mockReturnValue('fake-token');

    const res = await request(app)
      .post('/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ token: 'fake-token' });
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { username: 'testuser', password: 'hashedpassword' },
    });
    expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, 'test-secret', {
      expiresIn: '7d',
    });
  });

  it('should return 409 when username already exists', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    const duplicateError = new Error('Unique constraint failed');
    (duplicateError as any).code = 'P2002';
    (prisma.user.create as jest.Mock).mockRejectedValue(duplicateError);

    const res = await request(app)
      .post('/register')
      .send({ username: 'existing', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ message: 'Username already taken' });
  });

  it('should return 500 on unexpected error', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .post('/register')
      .send({ username: 'newuser', password: 'password123' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Internal server error' });
  });
});

describe('POST /login', () => {
  it('should login successfully and return 200 with token', async () => {
    const mockUser = { id: 2, username: 'testuser', password: 'hashedpassword' };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('login-token');

    const res = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'login-token' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'testuser' },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    expect(jwt.sign).toHaveBeenCalledWith({ userId: 2 }, 'test-secret', {
      expiresIn: '7d',
    });
  });

  it('should return 401 when user is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/login')
      .send({ username: 'unknown', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid credentials' });
  });

  it('should return 401 when password does not match', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 3,
      username: 'testuser',
      password: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid credentials' });
  });
});