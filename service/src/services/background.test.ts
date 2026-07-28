import cron from 'node-cron';
import prisma from '../db/prisma';
import { sendPushNotification } from './push';
import { startBackgroundJob } from './background';

jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    reminder: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('./push', () => ({
  sendPushNotification: jest.fn(),
}));

describe('startBackgroundJob', () => {
  let cronScheduleMock: jest.Mock;
  let findManyMock: jest.Mock;
  let updateMock: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    cronScheduleMock = cron.schedule as jest.Mock;
    findManyMock = prisma.reminder.findMany as jest.Mock;
    updateMock = prisma.reminder.update as jest.Mock;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should schedule a cron job with the correct expression and a callback', () => {
    startBackgroundJob();
    expect(cronScheduleMock).toHaveBeenCalledTimes(1);
    expect(cronScheduleMock).toHaveBeenCalledWith('*/30 * * * * *', expect.any(Function));
  });

  it('should process due reminders, log each, and mark them as notified', async () => {
    const reminders = [
      { id: 1, userId: 'user1', dueTime: new Date(), notified: false, user: { id: 'user1', email: 'test@example.com' } },
      { id: 2, userId: 'user2', dueTime: new Date(), notified: false, user: { id: 'user2', email: 'test2@example.com' } },
    ];
    findManyMock.mockResolvedValue(reminders);
    updateMock.mockResolvedValue({});

    startBackgroundJob();
    const scheduleCallback = cronScheduleMock.mock.calls[0][1];
    await scheduleCallback();

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        notified: false,
        dueTime: { lte: expect.any(Date) },
      },
      include: { user: true },
    });
    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy).toHaveBeenCalledWith('Reminder #1 due for user user1');
    expect(consoleLogSpy).toHaveBeenCalledWith('Reminder #2 due for user user2');
    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(updateMock).toHaveBeenNthCalledWith(1, { where: { id: 1 }, data: { notified: true } });
    expect(updateMock).toHaveBeenNthCalledWith(2, { where: { id: 2 }, data: { notified: true } });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  it('should handle no due reminders gracefully', async () => {
    findManyMock.mockResolvedValue([]);

    startBackgroundJob();
    const scheduleCallback = cronScheduleMock.mock.calls[0][1];
    await scheduleCallback();

    expect(findManyMock).toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should handle reminders with missing user relation without crashing', async () => {
    const reminders = [
      { id: 3, userId: 'user3', dueTime: new Date(), notified: false, user: null },
    ];
    findManyMock.mockResolvedValue(reminders);
    updateMock.mockResolvedValue({});

    startBackgroundJob();
    const scheduleCallback = cronScheduleMock.mock.calls[0][1];
    await scheduleCallback();

    expect(consoleLogSpy).toHaveBeenCalledWith('Reminder #3 due for user user3');
    expect(updateMock).toHaveBeenCalledWith({ where: { id: 3 }, data: { notified: true } });
  });

  it('should catch and log error when prisma.findMany fails', async () => {
    const testError = new Error('Database connection lost');
    findManyMock.mockRejectedValue(testError);

    startBackgroundJob();
    const scheduleCallback = cronScheduleMock.mock.calls[0][1];
    await scheduleCallback();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Background job error:', testError);
    expect(updateMock).not.toHaveBeenCalled();
  });
});