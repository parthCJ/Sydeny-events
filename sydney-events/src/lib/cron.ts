import cron from 'node-cron';
import { scrapeAllEvents } from './scraper';

/**
 * Schedule automatic event scraping
 * Runs every 6 hours to keep events updated
 */
export function startEventScraperCron() {
  // Run every 6 hours: at 00:00, 06:00, 12:00, and 18:00
  cron.schedule('0 */6 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled event scraping...`);
    try {
      await scrapeAllEvents();
      console.log(`[${new Date().toISOString()}] Scheduled scraping completed successfully`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Scheduled scraping failed:`, error);
    }
  });

  console.log('Event scraper cron job started - running every 6 hours');
}

// Alternative: Run daily at 3 AM
export function startDailyScraperCron() {
  cron.schedule('0 3 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running daily event scraping...`);
    try {
      await scrapeAllEvents();
      console.log(`[${new Date().toISOString()}] Daily scraping completed successfully`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Daily scraping failed:`, error);
    }
  });

  console.log('Daily event scraper started - running at 3 AM daily');
}
