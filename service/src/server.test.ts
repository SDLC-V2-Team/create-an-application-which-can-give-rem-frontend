// server.test.ts
import { jest } from '@jest/globals';

// We use jest.isolateModules to prevent the server from starting
// on import and to allow fine-grained mock control per test.
describe('server entry point', () => {
  const originalPort = process.env.PORT;

  afterEach(() => {
    // Restore process.env.PORT to its initial value
    process.env.PORT = originalPort;
  });

  test('happy path: starts background job and listens on default port 4000 when PORT is not set', () => {
    // Ensure PORT is not set
    delete process.env.PORT;

    jest.isolateModules(() => {
      // Mock dependencies
      const mockListen = jest.fn();
      const mockStartBackgroundJob = jest.fn();
      const mockDotenvConfig = jest.fn();

      jest.doMock('dotenv', () => ({
        config: mockDotenvConfig,
      }));
      jest.doMock('./app', () => ({
        default: { listen: mockListen },
        // app is default exported, so need to match default import
      }));
      jest.doMock('./services/background', () => ({
        startBackgroundJob: mockStartBackgroundJob,
      }));

      // Spy on console.log to verify startup message
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Require the server module – this runs the top-level code
      require('./server');

      // Assertions
      expect(mockDotenvConfig).toHaveBeenCalled(); // dotenv config is loaded
      expect(mockStartBackgroundJob).toHaveBeenCalled();
      expect(mockListen).toHaveBeenCalledWith(4000, expect.any(Function));

      // Execute the listen callback to verify log message
      const listenCallback = mockListen.mock.calls[0][1];
      listenCallback();
      expect(consoleSpy).toHaveBeenCalledWith('Reminder service running on port 4000');

      consoleSpy.mockRestore();
    });
  });

  test('edge case: defaults to port 4000 when PORT is an empty string', () => {
    process.env.PORT = '';

    jest.isolateModules(() => {
      const mockListen = jest.fn();
      jest.doMock('./app', () => ({ default: { listen: mockListen } }));
      jest.doMock('./services/background', () => ({ startBackgroundJob: jest.fn() }));
      jest.doMock('dotenv', () => ({ config: jest.fn() }));

      require('./server');

      expect(mockListen).toHaveBeenCalledWith(4000, expect.any(Function));
    });
  });

  test('uses the PORT environment variable when set', () => {
    process.env.PORT = '8080';

    jest.isolateModules(() => {
      const mockListen = jest.fn();
      jest.doMock('./app', () => ({ default: { listen: mockListen } }));
      jest.doMock('./services/background', () => ({ startBackgroundJob: jest.fn() }));
      jest.doMock('dotenv', () => ({ config: jest.fn() }));

      require('./server');

      expect(mockListen).toHaveBeenCalledWith('8080', expect.any(Function));
    });
  });

  test('error path: if startBackgroundJob throws, app.listen is not called', () => {
    delete process.env.PORT; // default port

    jest.isolateModules(() => {
      const mockStartBackgroundJob = jest.fn(() => {
        throw new Error('Background job failure');
      });
      const mockListen = jest.fn();

      jest.doMock('./app', () => ({ default: { listen: mockListen } }));
      jest.doMock('./services/background', () => ({ startBackgroundJob: mockStartBackgroundJob }));
      jest.doMock('dotenv', () => ({ config: jest.fn() }));

      // Require the server; the top-level call to startBackgroundJob will throw
      // Since the module has side effects, we need to catch the error
      expect(() => {
        require('./server');
      }).toThrow('Background job failure');

      // Verify that listen was never called because the process crashes
      expect(mockListen).not.toHaveBeenCalled();
    });
  });

  test('ensures startBackgroundJob is called before app.listen', () => {
    delete process.env.PORT;

    jest.isolateModules(() => {
      const mockStartBackgroundJob = jest.fn();
      const mockListen = jest.fn();

      jest.doMock('./app', () => ({ default: { listen: mockListen } }));
      jest.doMock('./services/background', () => ({ startBackgroundJob: mockStartBackgroundJob }));
      jest.doMock('dotenv', () => ({ config: jest.fn() }));

      require('./server');

      // Check invocation order using mock.invocationCallOrder
      expect(mockStartBackgroundJob).toHaveBeenCalled();
      expect(mockListen).toHaveBeenCalled();

      const startCallOrder = mockStartBackgroundJob.mock.invocationCallOrder[0];
      const listenCallOrder = mockListen.mock.invocationCallOrder[0];
      expect(startCallOrder).toBeLessThan(listenCallOrder);
    });
  });
});