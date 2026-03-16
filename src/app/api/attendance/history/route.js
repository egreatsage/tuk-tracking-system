// src/app/api/attendance/history/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the unitId from the URL query parameters
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');

    if (!unitId) {
      return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 });
    }

    // Fetch lectures securely (ensuring the teacher actually owns this unit)
    const lectures = await prisma.lecture.findMany({
      where: { 
        unitId,
        teacher: { userId: session.user.id } 
      },
      include: {
        attendances: {
          include: {
            student: {
              include: { user: true }
            }
          }
        }
      },
      orderBy: [
        { date: 'desc' }, // Most recent lectures first
        { time: 'desc' }
      ]
    });

    return NextResponse.json(lectures, { status: 200 });
  } catch (error) {
    console.error('[attendance history GET]', error);
    return NextResponse.json({ error: 'Failed to fetch attendance history' }, { status: 500 });
  }
}