/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Mock the plugin to return a known object
jest.mock('@vitejs/plugin-react', () => {
  return {
    __esModule: true,
    default: jest.fn(() => 'mockReactPlugin'),
  };
});

import config from './vite.config';

describe('Vite configuration', () => {
  it('should include the react plugin', () => {
    // config is the return of defineConfig, which is the user config object
    expect(config.plugins).toBeDefined();
    expect(config.plugins).toHaveLength(1);
    // The plugin is the return of the mocked react()
    expect(config.plugins[0]).toBe('mockReactPlugin');
  });

  it('should define server proxy for /api', () => {
    expect(config.server).toBeDefined();
    expect(config.server?.proxy).toBeDefined();
    expect(config.server?.proxy).toHaveProperty('/api');
    expect(config.server?.proxy['/api']).toBeDefined();
  });

  it('should proxy /api to http://localhost:4000', () => {
    const proxyEntry = config.server?.proxy['/api'];
    expect(proxyEntry).toHaveProperty('target', 'http://localhost:4000');
    expect(proxyEntry).toHaveProperty('changeOrigin', true);
  });

  it('should not have any extra properties in the proxy definition', () => {
    const proxyEntry = config.server?.proxy['/api'];
    const keys = Object.keys(proxyEntry || {});
    // Only target and changeOrigin are expected
    expect(keys).toEqual(expect.arrayContaining(['target', 'changeOrigin']));
    expect(keys.length).toBe(2);
  });
});