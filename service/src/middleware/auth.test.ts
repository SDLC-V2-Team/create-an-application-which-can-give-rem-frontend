import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from './auth';

jest.mock('jsonwebtoken');
const mockJwtVerify = jwt.verify as jest.Mock;

describe('authenticate middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'testsecret';
    jest.clearAllMocks();
  });

  it('should set userId and call next for a valid token', () => {
    const token = 'validtoken';
    const decodedUser = { userId: 123 };
    req.headers!.authorization = `Bearer ${token}`;
    mockJwtVerify.mockReturnValue(decodedUser);

    authenticate(req as AuthRequest, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith(token, 'testsecret');
    expect(req.userId).toBe(123);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header is missing', () => {
    authenticate(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with Bearer', () => {
    req.headers!.authorization = 'Basic sometoken';
    authenticate(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token is invalid', () => {
    const token = 'invalidtoken';
    req.headers!.authorization = `Bearer ${token}`;
    mockJwtVerify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    authenticate(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token verification fails with any error', () => {
    const token = 'expiredtoken';
    req.headers!.authorization = `Bearer ${token}`;
    mockJwtVerify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    authenticate(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token string is empty after Bearer', () => {
    req.headers!.authorization = 'Bearer ';
    mockJwtVerify.mockImplementation(() => {
      throw new Error('jwt must be provided');
    });

    authenticate(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});