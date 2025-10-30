import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from './prisma';

interface ScrapedEvent {
  title: string;
  description?: string;
  venue?: string;
  address?: string;
  startDate: Date;
  endDate?: Date;
  imageUrl?: string;
  ticketUrl: string;
  price?: string;
  category?: string;
  organizer?: string;
  source: string;
  sourceId?: string;
}

/**
 * Scrapes events from Timeout Sydney
 */
async function scrapeTimeoutSydney(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  
  try {
    const response = await axios.get('https://www.timeout.com/sydney/things-to-do/whats-on-in-sydney-today', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Note: Selectors may need adjustment based on actual website structure
    $('.event-card, .card-item, [data-test="event-card"]').each((_, element) => {
      const $el = $(element);
      
      const title = $el.find('h3, .card-title, [data-test="event-title"]').first().text().trim();
      const description = $el.find('.description, .event-description').first().text().trim();
      const venue = $el.find('.venue, .location').first().text().trim();
      const imageUrl = $el.find('img').first().attr('src');
      const linkEl = $el.find('a').first();
      const relativeUrl = linkEl.attr('href');
      const ticketUrl = relativeUrl?.startsWith('http') 
        ? relativeUrl 
        : `https://www.timeout.com${relativeUrl}`;
      
      if (title && ticketUrl) {
        events.push({
          title,
          description: description || undefined,
          venue: venue || undefined,
          address: 'Sydney, NSW',
          startDate: new Date(), // Would parse from actual date string
          imageUrl: imageUrl || undefined,
          ticketUrl,
          category: 'General',
          source: 'timeout',
          sourceId: relativeUrl?.split('/').pop(),
        });
      }
    });
  } catch (error) {
    console.error('Error scraping Timeout Sydney:', error);
  }
  
  return events;
}

/**
 * Scrapes events from Eventbrite (Sydney area)
 */
async function scrapeEventbrite(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  
  try {
    // Eventbrite's public API or web scraping
    const response = await axios.get('https://www.eventbrite.com.au/d/australia--sydney/events/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    $('[data-testid="search-event-card"], .search-event-card').each((_, element) => {
      const $el = $(element);
      
      const title = $el.find('h2, h3, .event-card__title').first().text().trim();
      const venue = $el.find('.event-card__venue, .card-text--truncated__one').first().text().trim();
      const price = $el.find('.event-card__price').first().text().trim();
      const imageUrl = $el.find('img').first().attr('src');
      const linkEl = $el.find('a').first();
      const ticketUrl = linkEl.attr('href') || '';
      
      if (title && ticketUrl) {
        events.push({
          title,
          venue: venue || undefined,
          address: 'Sydney, NSW',
          startDate: new Date(),
          imageUrl: imageUrl || undefined,
          ticketUrl: ticketUrl.startsWith('http') ? ticketUrl : `https://www.eventbrite.com.au${ticketUrl}`,
          price: price || 'Free',
          category: 'General',
          source: 'eventbrite',
          sourceId: ticketUrl.split('/').find(s => s.startsWith('e-'))?.replace('e-', ''),
        });
      }
    });
  } catch (error) {
    console.error('Error scraping Eventbrite:', error);
  }
  
  return events;
}

/**
 * Mock scraper - returns sample events for testing
 */
async function scrapeMockEvents(): Promise<ScrapedEvent[]> {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return [
    {
      title: 'Sydney Opera House: La Bohème',
      description: 'Experience Puccini\'s timeless masterpiece at the iconic Sydney Opera House. A tragic love story set in 19th-century Paris.',
      venue: 'Sydney Opera House',
      address: 'Bennelong Point, Sydney NSW 2000',
      startDate: tomorrow,
      endDate: tomorrow,
      imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
      ticketUrl: 'https://www.sydneyoperahouse.com',
      price: 'From $89',
      category: 'Arts & Culture',
      organizer: 'Sydney Opera House',
      source: 'mock',
      sourceId: 'opera-1',
    },
    {
      title: 'Vivid Sydney 2025',
      description: 'The world\'s largest festival of light, music and ideas returns to Sydney. Explore stunning light installations across the city.',
      venue: 'Multiple Locations',
      address: 'Sydney CBD, NSW 2000',
      startDate: nextWeek,
      imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      ticketUrl: 'https://www.vividsydney.com',
      price: 'Free',
      category: 'Festival',
      organizer: 'Destination NSW',
      source: 'mock',
      sourceId: 'vivid-2025',
    },
    {
      title: 'Bondi Beach Markets',
      description: 'Shop local art, fashion, jewelry, homewares and enjoy delicious food at this iconic beachside market.',
      venue: 'Bondi Beach',
      address: 'Bondi Beach Public School, Campbell Parade, Bondi Beach NSW',
      startDate: new Date(today.setHours(10, 0, 0, 0)),
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      ticketUrl: 'https://www.bondimarkets.com.au',
      price: 'Free Entry',
      category: 'Markets',
      organizer: 'Bondi Markets',
      source: 'mock',
      sourceId: 'bondi-markets',
    },
    {
      title: 'Sydney Harbour Bridge Climb',
      description: 'Climb to the summit of the iconic Sydney Harbour Bridge for breathtaking 360-degree views of the city.',
      venue: 'Sydney Harbour Bridge',
      address: '3 Cumberland Street, The Rocks NSW 2000',
      startDate: today,
      imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
      ticketUrl: 'https://www.bridgeclimb.com',
      price: 'From $174',
      category: 'Adventure',
      organizer: 'BridgeClimb Sydney',
      source: 'mock',
      sourceId: 'bridge-climb',
    },
    {
      title: 'Taronga Zoo Twilight Concert Series',
      description: 'Enjoy live music performances with stunning views of Sydney Harbour as the sun sets over the city.',
      venue: 'Taronga Zoo',
      address: 'Bradleys Head Road, Mosman NSW 2088',
      startDate: nextWeek,
      imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800',
      ticketUrl: 'https://taronga.org.au/twilight-concerts',
      price: 'From $65',
      category: 'Music',
      organizer: 'Taronga Conservation Society',
      source: 'mock',
      sourceId: 'taronga-concert',
    },
    {
      title: 'Royal Botanic Garden Sydney Tours',
      description: 'Join a free guided walking tour through one of the world\'s finest botanic gardens in the heart of Sydney.',
      venue: 'Royal Botanic Garden',
      address: 'Mrs Macquaries Road, Sydney NSW 2000',
      startDate: today,
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
      ticketUrl: 'https://www.botanicgardens.org.au',
      price: 'Free',
      category: 'Nature',
      organizer: 'Botanic Gardens of Sydney',
      source: 'mock',
      sourceId: 'botanic-tour',
    },
  ];
}

/**
 * Main scraping orchestrator
 */
export async function scrapeAllEvents(): Promise<void> {
  console.log('Starting event scraping...');
  
  // Combine all scrapers
  const [timeoutEvents, eventbriteEvents, mockEvents] = await Promise.all([
    scrapeTimeoutSydney(),
    scrapeEventbrite(),
    scrapeMockEvents(),
  ]);
  
  const allEvents = [...timeoutEvents, ...eventbriteEvents, ...mockEvents];
  
  console.log(`Scraped ${allEvents.length} events`);
  
  // Save to database
  let created = 0;
  let updated = 0;
  
  for (const event of allEvents) {
    try {
      const existing = await prisma.event.findFirst({
        where: {
          source: event.source,
          sourceId: event.sourceId || '',
        },
      });
      
      if (existing) {
        await prisma.event.update({
          where: { id: existing.id },
          data: event,
        });
        updated++;
      } else {
        await prisma.event.create({
          data: event,
        });
        created++;
      }
    } catch (error) {
      console.error(`Error saving event: ${event.title}`, error);
    }
  }
  
  console.log(`Created: ${created}, Updated: ${updated} events`);
}

// Run scraper if executed directly
if (require.main === module) {
  scrapeAllEvents()
    .then(() => {
      console.log('Scraping completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}
