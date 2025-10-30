import { NextResponse } from 'next/server';
import { scrapeAllEvents } from '@/lib/scraper';

export async function POST(request: Request) {
  try {
    // Optional: Add API key authentication here
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Simple secret key check (in production, use proper authentication)
    if (secret !== process.env.SCRAPER_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await scrapeAllEvents();
    
    return NextResponse.json({
      success: true,
      message: 'Events scraped successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error scraping events:', error);
    return NextResponse.json(
      { error: 'Failed to scrape events' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
