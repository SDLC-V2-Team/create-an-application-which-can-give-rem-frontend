import axios from 'axios';
import api from './api';

jest.mock('axios', () => ({
  create: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('api service', () => {
  const mockRequestInterceptor = jest.fn((config) => config);
  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: jest.fn((onFulfilled: (config: any) => any) => {
          mockRequestInterceptor.mockImplementation(onFulfilled);
        }),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    // Re-import to trigger interceptor binding
    jest.isolateModules(() => {
      jest.requireActual('./api');
      const apiModule = require('./api').default;
      // Actually we need to re-run the module to capture the interceptor registration.
      // Instead, we'll manually invoke the interceptor after setting up mocks.
      // But the original api import is already created. We'll just rely on the fact
      // that the interceptor callback was registered when module was loaded.
      // Since tests run sequentially, we need to re-register each time.
      // However, the api from import is a singleton. Better to re-require inside test.
    });
    // For simplicity, we'll manually trigger the interceptor callback we captured.
    // But we need to capture it when api module loads. We'll re-import api after mocking.
    jest.resetModules();
    // We'll import a fresh api in each test, but re-importing triggers create again.
    // So we'll change approach: We'll dynamically import inside tests, but need to handle async.
    // Alternatively, we can test the interceptor function directly by extracting it.
    // We know api file calls api.interceptors.request.use(callback). So we can capture the callback.
    // So we'll update mockAxiosInstance.interceptors.request.use to capture the callback into a variable.
  });

  // Helper to get the interceptor callback
  let requestInterceptorCallback: (config: any) => any;
  beforeAll(() => {
    (axios.create as jest.Mock).mockImplementation((...args: any[]) => {
      const instance = {
        interceptors: {
          request: {
            use: jest.fn((callback: (config: any) => any) => {
              requestInterceptorCallback = callback;
            }),
          },
        },
      };
      return instance;
    });
    // Force re-import of the module to trigger mocking
    jest.resetModules();
    const freshApi = require('./api').default;
    // Now requestInterceptorCallback should be set.
  });

  // Since we re-import in beforeAll, we can use that api.
  // But we need to mock localStorage and axios.create before that. done.

  describe('axios instance creation', () => {
    it('should create axios instance with baseURL /api and json headers', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: '/api',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('request interceptor', () => {
    it('should add Authorization header when token is present in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('abc123');
      const config = { headers: {} };
      const result = requestInterceptorCallback(config);
      expect(result.headers.Authorization).toBe('Bearer abc123');
    });

    it('should not add Authorization header when token is null', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const config = { headers: {} };
      const result = requestInterceptorCallback(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should not add Authorization header when token is empty string', () => {
      localStorageMock.getItem.mockReturnValue('');
      const config = { headers: {} };
      const result = requestInterceptorCallback(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should return config even if no token', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const config = { baseURL: '/test', headers: { 'X-Custom': 'value' } };
      const result = requestInterceptorCallback(config);
      expect(result).toBe(config);
      expect(result.baseURL).toBe('/test');
      expect(result.headers['X-Custom']).toBe('value');
    });
  });
});