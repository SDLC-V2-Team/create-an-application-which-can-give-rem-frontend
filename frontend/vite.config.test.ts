import { describe, expect, it } from '@jest/globals';
import config from './vite.config';

describe('Vite Configuration', () => {
  it('should be defined and not null', () => {
    expect(config).toBeDefined();
  });

  it('should have plugins array', () => {
    expect(config.plugins).toBeInstanceOf(Array);
  });

  it('should include react plugin', () => {
    expect(config.plugins.length).toBeGreaterThan(0);
    expect(typeof config.plugins[0]).toBe('function');
  });

  it('should set server port to 3000', () => {
    expect(config.server?.port).toBe(3000);
  });

  it('should proxy /api to http://localhost:4000', () => {
    expect(config.server?.proxy).toEqual({ '/api': 'http://localhost:4000' });
  });
});