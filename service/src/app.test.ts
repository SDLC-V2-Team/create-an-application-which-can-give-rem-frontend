import { jest } from '@jest/globals';

// Manual mocks will be applied via jest.doMock in beforeEach

describe('app setup', () => {
  const mockUse = jest.fn();
  const mockApp = { use: mockUse };
  let corsMock: jest.Mock;
  let expressMock: jest.Mock & { json: jest.Mock };
  let authRoutes: jest.Mock;
  let reminderRoutes: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    mockUse.mockClear();

    corsMock = jest.fn(() => 'mockCorsMiddleware');
    expressMock = jest.fn(() => mockApp) as any;
    expressMock.json = jest.fn(() => 'mockJsonParser');

    authRoutes = jest.fn();
    reminderRoutes = jest.fn();

    jest.doMock('cors', () => corsMock);
    jest.doMock('express', () => expressMock);
    jest.doMock('../routes/auth', () => ({ default: authRoutes }));
    jest.doMock('../routes/reminders', () => ({ default: reminderRoutes }));
  });

  const importApp = async () => await import('./app');

  it('should create an express application', async () => {
    const appModule = await importApp();
    expect(appModule.default).toBe(mockApp);
    expect(expressMock).toHaveBeenCalled();
  });

  it('should use CORS middleware with default origin (fallback when env missing)', async () => {
    await importApp();
    expect(mockUse).toHaveBeenCalledWith('mockCorsMiddleware');
    expect(corsMock).toHaveBeenCalledWith({ origin: 'http://localhost:5173' });
  });

  it('should use CORS middleware with CORS_ORIGIN from environment', async () => {
    process.env.CORS_ORIGIN = 'http://example.com';
    try {
      await importApp();
      expect(corsMock).toHaveBeenCalledWith({ origin: 'http://example.com' });
    } finally {
      delete process.env.CORS_ORIGIN;
    }
  });

  it('should use JSON body parser', async () => {
    await importApp();
    expect(expressMock.json).toHaveBeenCalled();
    expect(mockUse).toHaveBeenCalledWith('mockJsonParser');
  });

  it('should mount auth routes at /api/auth', async () => {
    await importApp();
    expect(mockUse).toHaveBeenCalledWith('/api/auth', authRoutes);
  });

  it('should mount reminder routes at /api/reminders', async () => {
    await importApp();
    expect(mockUse).toHaveBeenCalledWith('/api/reminders', reminderRoutes);
  });
});