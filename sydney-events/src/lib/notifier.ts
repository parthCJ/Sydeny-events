import cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';
import { prisma } from './prisma';
import { getNewEventsForUser } from './recommendations';
import { formatDate, formatTime } from './utils';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new TelegramBot(token);

/**
 * Check for new events and notify users
 * Runs every 6 hours
 */
export function startNotificationCron() {
  // Run every 6 hours at minute 0
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔔 Running notification check...');
    await checkAndNotifyUsers();
  });

  console.log('✅ Notification cron job started (every 6 hours)');
}

/**
 * Check all active users and send notifications for new matching events
 */
export async function checkAndNotifyUsers() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: { preferences: true },
  });

  console.log(`📊 Checking ${users.length} active users...`);

  let totalNotifications = 0;

  for (const user of users) {
    if (!user.preferences.length) {
      continue;
    }

    try {
      const newEvents = await getNewEventsForUser(user.id);

      if (newEvents.length === 0) {
        continue;
      }

      // Send notification for top 3 events
      const topEvents = newEvents.slice(0, 3);

      for (const match of topEvents) {
        const event = match.event;
        const reasons = match.reasons.join('\n• ');

        const message = `🎉 **New Event Alert!**

**${event.title}**

📅 ${formatDate(event.startDate)} at ${formatTime(event.startDate)}
📍 ${event.venue || 'TBA'}
💰 ${event.price || 'Free'}
🏷️ ${event.category || 'General'}

✨ **Why you'll love it:**
• ${reasons}

${event.description ? event.description.substring(0, 150) + '...' : ''}

🎫 [Get Tickets](${event.ticketUrl})

---
Use /events to see more recommendations!`;

        try {
          await bot.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });

          // Save notification record
          await prisma.notification.create({
            data: {
              userId: user.id,
              eventId: event.id,
              message,
              sent: true,
              sentAt: new Date(),
            },
          });

          totalNotifications++;
        } catch (error: any) {
          console.error(`❌ Failed to send to user ${user.telegramId}:`, error.message);

          // If user blocked the bot, deactivate them
          if (error.response?.statusCode === 403) {
            await prisma.user.update({
              where: { id: user.id },
              data: { isActive: false },
            });
          }
        }
      }

      // Small delay between users to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error processing user ${user.id}:`, error);
    }
  }

  console.log(`✅ Sent ${totalNotifications} notifications to ${users.length} users`);
}

/**
 * Notify specific user about an event
 */
export async function notifyUser(userId: string, eventId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!user || !event) {
    throw new Error('User or event not found');
  }

  const message = `🎉 **Event Recommendation**

**${event.title}**

📅 ${formatDate(event.startDate)} at ${formatTime(event.startDate)}
📍 ${event.venue || 'TBA'}
💰 ${event.price || 'Free'}

${event.description ? event.description.substring(0, 200) + '...' : ''}

🎫 [Get Tickets](${event.ticketUrl})`;

  await bot.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });

  await prisma.notification.create({
    data: {
      userId: user.id,
      eventId: event.id,
      message,
      sent: true,
      sentAt: new Date(),
    },
  });
}
