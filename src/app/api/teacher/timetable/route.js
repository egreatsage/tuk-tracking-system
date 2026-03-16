// src/app/api/teacher/timetable/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth'; // Using NextAuth v5 as per your setup

export async function GET(request) {
  try {
    // 1. Verify the user is logged in and is a teacher
    const session = await auth();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Find the teacher profile linked to this user account
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // 3. Fetch only the timetable slots assigned to this specific teacher
    const slots = await prisma.timetableSlot.findMany({
      where: { teacherId: teacherProfile.id },
      include: {
        unit: { 
          include: { course: true } 
        }
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    console.error('[teacher timetable GET]', error);
    return NextResponse.json({ error: 'Failed to fetch teacher timetable' }, { status: 500 });
  }
}