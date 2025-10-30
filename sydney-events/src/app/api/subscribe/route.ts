import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, eventId } = body;
    
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }
    
    // Save email to database
    const subscriber = await prisma.emailSubscriber.upsert({
      where: { email },
      update: { eventId },
      create: { email, eventId },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Email saved successfully',
      subscriber,
    });
  } catch (error) {
    console.error('Error saving email:', error);
    return NextResponse.json(
      { error: 'Failed to save email' },
      { status: 500 }
    );
  }
}
