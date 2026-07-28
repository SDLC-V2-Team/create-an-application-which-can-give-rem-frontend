import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  let disconnectResolveFn = () => {};

  const createMock = jest.fn();
  const disconnectMock = jest.fn().mockImplementation(() => {
    disconnectResolveFn();
    return Promise.resolve();
  });

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      reminder: {
        create: createMock,
      },
      $disconnect: disconnectMock,
    })),
    Category: {
      birthdays: 'birthdays',
      work: 'work',
      casual: 'casual',
      other: 'other',
    },
    __setDisconnectResolve: (fn: () => void) => {
      disconnectResolveFn = fn;
    },
  };
});

describe('seed script', () => {
  let disconnectPromise: Promise<void>;
  let mockCreate: jest.Mock;
  let mockDisconnect: jest.Mock;
  let mockExit: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset modules so that seed runs fresh each time
    jest.resetModules();

    // Set up deferred disconnect resolution
    disconnectPromise = new Promise<void>((resolve) => {
      const mockPrismaModule = require('@prisma/client');
      mockPrismaModule.__setDisconnectResolve(resolve);
    });

    // Spy on console and process.exit
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Load the mocked PrismaClient to access its mocks
    const mockedPrismaClient = PrismaClient as jest.Mock;
    mockCreate = mockedPrismaClient.mock.instances[0].reminder.create;
    mockDisconnect = mockedPrismaClient.mock.instances[0].$disconnect;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
  });

  it('should seed all reminders successfully', async () => {
    // Ensure create resolves for all calls
    mockCreate.mockResolvedValue(undefined);

    // Trigger the seed script
    require('./seed');

    // Wait for the finally block to call disconnect
    await disconnectPromise;

    // Verify that all four reminders were created
    expect(mockCreate).toHaveBeenCalledTimes(4);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: 1, title: 'Alice Birthday', description: 'Buy gift for Alice', category: 'birthdays' },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: 1, title: 'Team standup', description: 'Daily standup at 10am', category: 'work' },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: 1, title: 'Picnic with friends', description: 'Bring snacks', category: 'casual' },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: 1, title: 'Grocery shopping', description: 'Buy milk and eggs', category: 'other' },
    });

    // Verify disconnect was called once
    expect(mockDisconnect).toHaveBeenCalledTimes(1);

    // Console output
    expect(consoleLogSpy).toHaveBeenCalledWith('Seeding database...');
    expect(consoleLogSpy).toHaveBeenCalledWith('Seeding finished.');
  });

  it('should handle database error and exit with code 1', async () => {
    const error = new Error('Database error');
    mockCreate.mockRejectedValueOnce(error);

    // The seed script catches the error and calls process.exit(1)
    // We prevent actual exit with our spy
    require('./seed');

    // Wait for disconnect to be called in finally
    await disconnectPromise;

    // Verify that only the first create was attempted
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: 1, title: 'Alice Birthday', description: 'Buy gift for Alice', category: 'birthdays' },
    });

    // Check that the error was logged and process.exit was called with 1
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(mockExit).toHaveBeenCalledWith(1);

    // Finally should still run disconnect
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('should log correct messages during seeding', async () => {
    mockCreate.mockResolvedValue(undefined);

    require('./seed');
    await disconnectPromise;

    // Verify the exact log sequence
    expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 'Seeding database...');
    expect(consoleLogSpy).toHaveBeenNthCalledWith(2, 'Seeding finished.');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});