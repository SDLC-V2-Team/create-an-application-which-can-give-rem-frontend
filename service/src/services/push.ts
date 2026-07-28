import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:example@yourdomain.org',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: webPush.PushSubscription,
  payload: { title: string; body: string }
) {
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Push notification failed:', error);
    // Optionally handle expired subscription (delete from DB)
  }
}
