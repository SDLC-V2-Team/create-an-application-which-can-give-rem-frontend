let pushListener, notificationclickListener;
let mockShowNotification;
let mockCloseNotification;
let mockOpenWindow;

beforeEach(() => {
  jest.resetModules();
  mockShowNotification = jest.fn().mockResolvedValue(undefined);
  mockCloseNotification = jest.fn();
  mockOpenWindow = jest.fn().mockResolvedValue(undefined);

  pushListener = undefined;
  notificationclickListener = undefined;

  global.self = {
    addEventListener: (event, listener) => {
      if (event === 'push') pushListener = listener;
      else if (event === 'notificationclick') notificationclickListener = listener;
    },
    registration: {
      showNotification: mockShowNotification,
    },
  };
  global.clients = {
    openWindow: mockOpenWindow,
  };

  require('./sw');
});

describe('Service Worker push event', () => {
  test('should show notification with correct options when event has valid data', async () => {
    const title = 'Test Reminder';
    const body = 'This is a test';
    const eventData = {
      json: jest.fn().mockReturnValue({ title, body }),
    };
    const waitUntil = jest.fn();
    const event = { data: eventData, waitUntil };

    pushListener(event);

    expect(eventData.json).toHaveBeenCalledTimes(1);
    expect(mockShowNotification).toHaveBeenCalledWith(title, {
      body,
      icon: '/icon.png',
      badge: '/badge.png',
    });
    expect(waitUntil).toHaveBeenCalledTimes(1);
    const waitCallArg = waitUntil.mock.calls[0][0];
    expect(waitCallArg).toBeInstanceOf(Promise);
  });

  test('should not call showNotification if event has no data', () => {
    const waitUntil = jest.fn();
    const event = { data: null, waitUntil };

    pushListener(event);

    expect(mockShowNotification).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  test('should throw error if event data cannot be parsed as JSON', () => {
    const eventData = {
      json: jest.fn(() => { throw new Error('Invalid JSON'); }),
    };
    const waitUntil = jest.fn();
    const event = { data: eventData, waitUntil };

    expect(() => pushListener(event)).toThrow('Invalid JSON');
    expect(mockShowNotification).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });
});

describe('Service Worker notificationclick event', () => {
  test('should close the notification and open root window', async () => {
    const notification = { close: mockCloseNotification };
    const waitUntil = jest.fn();
    const event = { notification, waitUntil };

    notificationclickListener(event);

    expect(mockCloseNotification).toHaveBeenCalledTimes(1);
    expect(mockOpenWindow).toHaveBeenCalledWith('/');
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(waitUntil.mock.calls[0][0]).toBeInstanceOf(Promise);
  });
});