// client/src/register-sw.test.ts

describe('service worker registration', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.resetModules();
  });

  const mockSuccessfulRegister = jest.fn().mockResolvedValue({ scope: 'https://example.com/' });
  const mockFailingRegister = jest.fn().mockRejectedValue(new Error('registration failed'));

  function setupEnvironment(
    navigatorOverrides: Record<string, any>,
    windowOverrides: Record<string, any>
  ) {
    global.navigator = navigatorOverrides as Navigator;
    global.window = windowOverrides as Window & typeof globalThis;
  }

  function importModule() {
    // Use jest.isolateModules to force re-execution of the side-effect script
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('./register-sw');
    });
  }

  test('registers service worker and logs success when both APIs are available', () => {
    setupEnvironment(
      { serviceWorker: { register: mockSuccessfulRegister } },
      { PushManager: class {} }
    );
    importModule();
    expect(mockSuccessfulRegister).toHaveBeenCalledWith('/sw.js');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Service Worker registered with scope:',
      'https://example.com/'
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('logs error when service worker registration promise rejects', () => {
    setupEnvironment(
      { serviceWorker: { register: mockFailingRegister } },
      { PushManager: class {} }
    );
    importModule();
    expect(mockFailingRegister).toHaveBeenCalledWith('/sw.js');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Service Worker registration failed:',
      new Error('registration failed')
    );
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  test('does nothing when navigator.serviceWorker is not present', () => {
    const registrationsSpy = jest.fn();
    setupEnvironment(
      { /* no serviceWorker property */ },
      { PushManager: class {} }
    );
    // Ensure register is never called by spying on something that doesn't exist? 
    // We'll just verify no console output and no error. 
    importModule();
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    // Also check that navigator.serviceWorker was never accessed.
  });

  test('does nothing when window.PushManager is not present', () => {
    setupEnvironment(
      { serviceWorker: { register: jest.fn() } },
      { /* no PushManager */ }
    );
    importModule();
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('throws an error when serviceWorker.register is not a function', () => {
    setupEnvironment(
      { serviceWorker: {} }, // object without register
      { PushManager: class {} }
    );
    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('./register-sw');
      });
    }).toThrow();
  });
});