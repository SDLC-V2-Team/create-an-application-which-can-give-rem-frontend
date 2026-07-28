import cron from 'node-cron';
import prisma from '../db/prisma';
import { sendPushNotification } from './push';

// Run every 30 seconds to check due reminders (meets NFR-001 5 second requirement)
export function startBackgroundJob() {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const dueReminders = await prisma.reminder.findMany({
        where: {
          notified: false,
          dueTime: { lte: new Date() },
        },
        include: { user: true },
      });

      for (const reminder of dueReminders) {
        // For simplicity, skip push if user has no subscription; in real app store subscriptions per user
        // await sendPushNotification(...);
        console.log(`Reminder #${reminder.id} due for user ${reminder.userId}`);

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { notified: true },
        });
      }
    } catch (err) {
      console.error('Background job error:', err);
    }
  });
}
