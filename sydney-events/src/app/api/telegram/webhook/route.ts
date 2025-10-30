import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    // This endpoint receives updates from Telegram
    // In production, you'd verify the webhook secret

    // Process the message
    console.log('Received Telegram update:', message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Telegram webhook endpoint',
    status: 'active',
  });
}
