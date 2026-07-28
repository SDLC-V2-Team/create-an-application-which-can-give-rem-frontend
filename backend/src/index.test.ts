import request from 'supertest';

// Mock error handler middleware
const mockErrorHandler = jest.fn((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: 'internal' });
});
jest.mock('./middleware/errorHandler', () => mockErrorHandler);

// Mock reminder routes with a few endpoints
jest.mock('./routes/reminders', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req: any, res: any) => res.json({ message: 'reminders' }));
  router.post('/', (req: any, res: any) => res.json({ received: req.body }));
  router.get('/error', (req: any, res: any, next: any) => {
    next(new Error('test error'));
  });
  return router;
});

// Import the app after mocks
import app from './index';

describe('Express App', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should respond to health check with status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should include CORS headers in responses', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://example.com');
    expect(response.headers['access-control-allow-origin']).toBe('http://example.com');
    // Or expect '*' if using default cors without any options, but default cors reflects origin.
    // Actually default cors sets Access-Control-Allow-Origin to the request origin.
    // So it will be http://example.com
  });

  it('should handle reminder GET route correctly', async () => {
    const response = await request(app).get('/api/reminders');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'reminders' });
  });

  it('should parse JSON body via express.json middleware', async () => {
    const payload = { name: 'Test', value: 42 };
    const response = await request(app)
      .post('/api/reminders')
      .send(payload)
      .set('Content-Type', 'application/json');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: payload });
  });

  it('should catch errors and respond via error handler middleware', async () => {
    const response = await request(app).get('/api/reminders/error');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'internal' });
    // Verify that the mocked error handler was called
    expect(mockErrorHandler).toHaveBeenCalled();
  });
});