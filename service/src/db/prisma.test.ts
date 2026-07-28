import { PrismaClient } from '@prisma/client';

// Mock PrismaClient before importing the module that uses it
const mockPrismaClientInstance = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  reminder: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const MockPrismaClient = jest.fn().mockImplementation(() => mockPrismaClientInstance);

jest.mock('@prisma/client', () => ({
  PrismaClient: MockPrismaClient,
}));

import prisma from '../db/prisma';

describe('Prisma client singleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should export an instance of PrismaClient', () => {
    expect(prisma).toBe(mockPrismaClientInstance);
  });

  test('should be a singleton (constructor called exactly once)', () => {
    // The import triggers new PrismaClient() – exactly once
    expect(MockPrismaClient).toHaveBeenCalledTimes(1);
  });

  test('should support connecting to the database', async () => {
    mockPrismaClientInstance.$connect.mockResolvedValue(undefined);
    await expect(prisma.$connect()).resolves.toBeUndefined();
    expect(mockPrismaClientInstance.$connect).toHaveBeenCalledTimes(1);
  });

  test('should handle connection error gracefully', async () => {
    const error = new Error('Connection failed');
    mockPrismaClientInstance.$connect.mockRejectedValue(error);
    await expect(prisma.$connect()).rejects.toThrow('Connection failed');
    expect(mockPrismaClientInstance.$connect).toHaveBeenCalledTimes(1);
  });

  test('should expose the reminder model with expected methods', () => {
    expect(prisma.reminder).toBeDefined();
    expect(typeof prisma.reminder.findMany).toBe('function');
    expect(typeof prisma.reminder.create).toBe('function');
    expect(typeof prisma.reminder.update).toBe('function');
    expect(typeof prisma.reminder.delete).toBe('function');
  });
});