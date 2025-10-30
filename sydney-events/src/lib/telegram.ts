import TelegramBot from 'node-telegram-bot-api';
import { prisma } from './prisma';
import { findMatchingEvents } from './recommendations';
import { formatDate, formatTime } from './utils';

// Initialize bot
const token = process.env.TELEGRAM_BOT_TOKEN || '';

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in .env file');
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram bot is running...');

// Store conversation context
const conversationContext = new Map<
  number,
  Array<{ role: 'user' | 'assistant'; content: string }>
>();

/**
 * Start command - welcome message
 */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString() || '';
  const username = msg.from?.username || '';
  const firstName = msg.from?.first_name || '';
  const lastName = msg.from?.last_name || '';

  // Create or update user in database
  await prisma.user.upsert({
    where: { telegramId: userId },
    create: {
      telegramId: userId,
      username,
      firstName,
      lastName,
      isActive: true,
    },
    update: {
      username,
      firstName,
      lastName,
      isActive: true,
    },
  });

  const welcomeMessage = `👋 Welcome to Sydney Events Bot!

I'm here to help you discover amazing events in Sydney based on your interests.

🎯 Here's what I can do:
• Learn your event preferences
• Recommend events you'll love
• Notify you when new matching events are added

📝 To get started, tell me about your interests!

For example:
"I love live music and art exhibitions"
"I prefer free or cheap events on weekends"
"I'm into sports and outdoor activities"

Available commands:
/start - Show this welcome message
/preferences - View your current preferences
/events - See recommended events
/help - Get help`;

  await bot.sendMessage(chatId, welcomeMessage);
});

/**
 * Preferences command - show current preferences
 */
bot.onText(/\/preferences/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString() || '';

  const user = await prisma.user.findUnique({
    where: { telegramId: userId },
    include: { preferences: true },
  });

  if (!user || !user.preferences.length) {
    await bot.sendMessage(
      chatId,
      '❌ You haven\'t set any preferences yet.\n\nTell me about your interests to get started!'
    );
    return;
  }

  const pref = user.preferences[0];
  const categories = pref.categories ? JSON.parse(pref.categories) : [];
  const preferredDays = pref.preferredDays ? JSON.parse(pref.preferredDays) : [];

  const message = `📋 Your Event Preferences:

🏷️ Categories: ${categories.length ? categories.join(', ') : 'Not set'}
💰 Price Range: ${pref.priceRange || 'Not set'}
📅 Preferred Days: ${preferredDays.length ? preferredDays.join(', ') : 'Not set'}
💡 Interests: ${pref.interests || 'Not set'}
💵 Budget: ${pref.budget || 'Not set'}

To update, just tell me your new preferences!`;

  await bot.sendMessage(chatId, message);
});

/**
 * Events command - show recommended events
 */
bot.onText(/\/events/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString() || '';

  const user = await prisma.user.findUnique({
    where: { telegramId: userId },
  });

  if (!user) {
    await bot.sendMessage(chatId, '❌ Please use /start to get started first!');
    return;
  }

  await bot.sendMessage(chatId, '🔍 Finding events for you...');

  const matches = await findMatchingEvents(user.id);

  if (matches.length === 0) {
    await bot.sendMessage(
      chatId,
      '😔 No events found matching your preferences right now.\n\nI\'ll notify you when new events are added!'
    );
    return;
  }

  // Send top 5 events
  for (const match of matches.slice(0, 5)) {
    const event = match.event;
    const reasons = match.reasons.join('\n• ');

    const message = `🎉 **${event.title}**

📅 ${formatDate(event.startDate)} at ${formatTime(event.startDate)}
📍 ${event.venue || 'TBA'}
💰 ${event.price || 'Free'}
🏷️ ${event.category || 'General'}

${event.description ? event.description.substring(0, 200) + '...' : ''}

✨ **Why this matches:**
• ${reasons}

🎫 [Get Tickets](${event.ticketUrl})`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
});

/**
 * Help command
 */
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `🤖 Sydney Events Bot Help

**Available Commands:**
/start - Welcome message
/preferences - View your preferences
/events - Get event recommendations
/help - Show this help message

**How to use:**
1. Tell me about your interests naturally
2. I'll learn your preferences and find matching events
3. You'll get notifications when new events are added

**Examples:**
"I like jazz music and comedy shows"
"Show me free events on weekends"
"I want indoor activities under $50"

Questions? Just ask me anything!`;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

/**
 * Handle regular messages (conversation)
 */
bot.on('message', async (msg) => {
  // Skip if it's a command
  if (msg.text?.startsWith('/')) return;

  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString() || '';
  const userMessage = msg.text || '';

  if (!userMessage) return;

  // Get or create user
  let user = await prisma.user.findUnique({
    where: { telegramId: userId },
    include: { preferences: true },
  });

  if (!user) {
    await bot.sendMessage(chatId, '👋 Please use /start to get started!');
    return;
  }

  // Get conversation context
  const context = conversationContext.get(chatId) || [];
  context.push({ role: 'user', content: userMessage });

  // Simple preference extraction (without LLM for now)
  const preferences = await extractPreferencesSimple(userMessage, user.preferences[0]);

  // Update user preferences
  if (Object.keys(preferences).length > 0) {
    await prisma.userPreference.upsert({
      where: { id: user.preferences[0]?.id || '' },
      create: {
        userId: user.id,
        ...preferences,
      },
      update: preferences,
    });

    // Generate response
    const response = await generateSimpleResponse(userMessage, preferences);
    context.push({ role: 'assistant', content: response });
    conversationContext.set(chatId, context.slice(-10)); // Keep last 10 messages

    await bot.sendMessage(chatId, response);

    // Offer to show events
    setTimeout(async () => {
      await bot.sendMessage(
        chatId,
        '💡 Want to see events matching your preferences? Use /events'
      );
    }, 1000);
  } else {
    // Just acknowledge
    await bot.sendMessage(
      chatId,
      '👍 Got it! Tell me more about what kind of events you like, and I\'ll help you find the perfect ones.'
    );
  }
});

/**
 * Simple preference extraction (keyword-based)
 */
async function extractPreferencesSimple(
  message: string,
  existing: any
): Promise<any> {
  const lower = message.toLowerCase();
  const preferences: any = {};

  // Extract categories
  const categoryKeywords: { [key: string]: string } = {
    'music|concert|band|jazz|rock|pop': 'Music',
    'art|exhibition|gallery|museum': 'Arts & Culture',
    'sport|game|match|football|cricket': 'Sports',
    'food|restaurant|dining|cuisine': 'Food & Drink',
    'festival|carnival': 'Festivals',
    'comedy|standup|laugh': 'Comedy',
    'theater|theatre|play|performance': 'Theatre',
  };

  const detectedCategories: string[] = [];
  for (const [keywords, category] of Object.entries(categoryKeywords)) {
    const regex = new RegExp(keywords, 'i');
    if (regex.test(lower)) {
      detectedCategories.push(category);
    }
  }

  if (detectedCategories.length > 0) {
    const existingCategories = existing?.categories
      ? JSON.parse(existing.categories)
      : [];
    const combined = [...new Set([...existingCategories, ...detectedCategories])];
    preferences.categories = JSON.stringify(combined);
  }

  // Extract price range
  if (lower.includes('free')) {
    preferences.priceRange = 'free';
  } else if (lower.match(/under \$?(\d+)/)) {
    const amount = parseInt(lower.match(/under \$?(\d+)/)![1]);
    if (amount <= 50) preferences.priceRange = '0-50';
    else if (amount <= 100) preferences.priceRange = '50-100';
    else preferences.priceRange = '100+';
  } else if (lower.includes('cheap') || lower.includes('budget')) {
    preferences.priceRange = '0-50';
  } else if (lower.includes('expensive') || lower.includes('premium')) {
    preferences.priceRange = '100+';
  }

  // Extract preferred days
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const detectedDays: string[] = [];
  for (const day of days) {
    if (lower.includes(day.toLowerCase())) {
      detectedDays.push(day);
    }
  }
  if (lower.includes('weekend')) {
    detectedDays.push('Saturday', 'Sunday');
  }
  if (lower.includes('weekday')) {
    detectedDays.push('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');
  }

  if (detectedDays.length > 0) {
    preferences.preferredDays = JSON.stringify([...new Set(detectedDays)]);
  }

  // Extract budget
  if (lower.includes('low budget') || lower.includes('cheap')) {
    preferences.budget = 'low';
  } else if (lower.includes('medium') || lower.includes('moderate')) {
    preferences.budget = 'medium';
  } else if (lower.includes('high budget') || lower.includes('premium')) {
    preferences.budget = 'high';
  }

  // Store interests as-is
  preferences.interests = message;

  return preferences;
}

/**
 * Generate simple response
 */
async function generateSimpleResponse(message: string, preferences: any): Promise<string> {
  const responses = [
    '✅ Got it! I\'ve updated your preferences.',
    '👍 Perfect! I\'ll remember that.',
    '📝 Noted! I\'ll find events matching your interests.',
    '🎯 Great! I\'ll keep that in mind when recommending events.',
  ];

  const response = responses[Math.floor(Math.random() * responses.length)];

  const details: string[] = [];
  if (preferences.categories) {
    const cats = JSON.parse(preferences.categories);
    details.push(`Looking for: ${cats.join(', ')}`);
  }
  if (preferences.priceRange) {
    details.push(`Price range: ${preferences.priceRange}`);
  }
  if (preferences.preferredDays) {
    const days = JSON.parse(preferences.preferredDays);
    details.push(`Preferred days: ${days.join(', ')}`);
  }

  return details.length > 0 ? `${response}\n\n${details.join('\n')}` : response;
}

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

export default bot;
