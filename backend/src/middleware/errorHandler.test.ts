import { Request, Response, NextFunction } from 'express';
import errorHandler from './errorHandler';

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return 404 with "Reminder not found" when error code is P2025', () => {
    const error = { code: 'P2025', message: 'Some Prisma error' };

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Reminder not found' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
  });

  it('should return 400 with error message when error name is "ValidationError"', () => {
    const error = { name: 'ValidationError', message: 'Invalid input' };

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: error.message });
  });

  it('should return 500 with "Internal server error" for unknown errors', () => {
    const error = new Error('Something broke');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

  it('should log the error to console.error', () => {
    const error = { some: 'error' };

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
  });
});