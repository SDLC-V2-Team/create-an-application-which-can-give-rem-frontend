import webPush from 'web-push';
import { sendPushNotification } from './push';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

describe('sendPushNotification', () => {
  const mockSubscription: webPush.PushSubscription = {
    endpoint: 'https://example.com/push-endpoint',
    keys: {
      p256dh: 'test-p256dh',
      auth: 'test-auth',
    },
  };

  const payload = { title: 'Test Title', body: 'Test body' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send a push notification with serialized payload', async () => {
    (webPush.sendNotification as jest.Mock).mockResolvedValue(undefined);

    await sendPushNotification(mockSubscription, payload);

    expect(webPush.sendNotification).toHaveBeenCalledWith(
      mockSubscription,
      JSON.stringify(payload)
    );
  });

  it('should log an error when sendNotification fails', async () => {
    const error = new Error('Push failed');
    (webPush.sendNotification as jest.Mock).mockRejectedValue(error);

    await sendPushNotification(mockSubscription, payload);

    expect(console.error).toHaveBeenCalledWith('Push notification failed:', error);
  });

  it('should handle expired subscription by logging and not throwing', async () => {
    const expiredError = new Error('expired subscription');
    (webPush.sendNotification as jest.Mock).mockRejectedValue(expiredError);

    await expect(
      sendPushNotification(mockSubscription, payload)
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith('Push notification failed:', expiredError);
    // In a real implementation you might also check that a DB cleanup was triggered.
  });

  it('should correctly stringify the payload, even when payload is empty', async () => {
    (webPush.sendNotification as jest.Mock).mockResolvedValue(undefined);
    const emptyPayload = { title: '', body: '' };

    await sendPushNotification(mockSubscription, emptyPayload);

    expect(webPush.sendNotification).toHaveBeenCalledWith(
      mockSubscription,
      JSON.stringify(emptyPayload)
    );
  });
});