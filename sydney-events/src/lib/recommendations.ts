import { prisma } from './prisma';

export interface EventMatch {
  event: any;
  score: number;
  reasons: string[];
}

/**
 * Find events matching user preferences
 */
export async function findMatchingEvents(userId: string): Promise<EventMatch[]> {
  // Get user preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true },
  });

  if (!user || !user.preferences.length) {
    return [];
  }

  const preference = user.preferences[0]; // Use most recent preference

  // Parse JSON fields
  const categories = preference.categories ? JSON.parse(preference.categories) : [];
  const preferredDays = preference.preferredDays ? JSON.parse(preference.preferredDays) : [];

  // Build query filters
  const where: any = {
    startDate: {
      gte: new Date(), // Future events only
    },
  };

  // Filter by categories if specified
  if (categories.length > 0) {
    where.category = {
      in: categories,
    };
  }

  // Get events
  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: 'asc' },
    take: 50,
  });

  // Score and filter events
  const matches: EventMatch[] = [];

  for (const event of events) {
    const { score, reasons } = scoreEvent(event, preference, preferredDays);

    if (score > 0) {
      matches.push({ event, score, reasons });
    }
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, 10); // Return top 10
}

/**
 * Score an event based on user preferences
 */
function scoreEvent(
  event: any,
  preference: any,
  preferredDays: string[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Category match (+3 points)
  const categories = preference.categories ? JSON.parse(preference.categories) : [];
  if (categories.includes(event.category)) {
    score += 3;
    reasons.push(`Matches your interest in ${event.category}`);
  }

  // Price match (+2 points)
  if (preference.priceRange) {
    const eventPrice = extractPrice(event.price);
    const [min, max] = parsePriceRange(preference.priceRange);

    if (eventPrice >= min && eventPrice <= max) {
      score += 2;
      reasons.push('Within your budget');
    }
  }

  // Day of week match (+1 point)
  if (preferredDays.length > 0) {
    const eventDay = new Date(event.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    if (preferredDays.includes(eventDay)) {
      score += 1;
      reasons.push(`Happening on ${eventDay}`);
    }
  }

  // Venue match (+1 point)
  if (preference.preferredVenues) {
    const venues = JSON.parse(preference.preferredVenues);
    if (venues.some((v: string) => event.venue?.toLowerCase().includes(v.toLowerCase()))) {
      score += 1;
      reasons.push('At a venue you like');
    }
  }

  // Interest keyword match (+1 point)
  if (preference.interests) {
    const interests = preference.interests.toLowerCase().split(',');
    const eventText = `${event.title} ${event.description}`.toLowerCase();

    for (const interest of interests) {
      if (eventText.includes(interest.trim())) {
        score += 1;
        reasons.push(`Related to your interest in ${interest.trim()}`);
        break;
      }
    }
  }

  return { score, reasons };
}

/**
 * Extract numeric price from price string
 */
function extractPrice(priceStr?: string): number {
  if (!priceStr) return 0;
  if (priceStr.toLowerCase().includes('free')) return 0;

  const match = priceStr.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

/**
 * Parse price range string to min/max
 */
function parsePriceRange(range: string): [number, number] {
  if (range === 'free') return [0, 0];
  if (range === '0-50') return [0, 50];
  if (range === '50-100') return [50, 100];
  if (range === '100+') return [100, 999999];

  return [0, 999999]; // Default: any price
}

/**
 * Get new events for user (events added since last notification)
 */
export async function getNewEventsForUser(userId: string): Promise<EventMatch[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      notifications: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user || !user.preferences.length) {
    return [];
  }

  const lastNotificationDate = user.notifications[0]?.createdAt || new Date(0);

  // Get matching events
  const allMatches = await findMatchingEvents(userId);

  // Filter to only new events (created after last notification)
  return allMatches.filter((match) => new Date(match.event.createdAt) > lastNotificationDate);
}
