// src/app/api/notifications/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch the 20 most recent notifications for the logged-in user
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('[notifications GET]', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Mark ALL notifications as read for this user
    await prisma.notification.updateMany({
      where: { 
        userId: session.user.id,
        isRead: false 
      },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[notifications PATCH]', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}