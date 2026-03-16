// src/app/api/student/timetable/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Find the student's profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        enrollments: true // Get the units they are enrolled in
      }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // 2. Extract the IDs of the units they are enrolled in
    const enrolledUnitIds = studentProfile.enrollments.map(e => e.unitId);

    if (enrolledUnitIds.length === 0) {
      return NextResponse.json([], { status: 200 }); // Return empty array if no enrollments
    }

    // 3. Fetch the timetable slots specifically for those units
    const slots = await prisma.timetableSlot.findMany({
      where: {
        unitId: { in: enrolledUnitIds }
      },
      include: {
        unit: {
          include: { course: true }
        },
        teacher: {
          include: { user: true }
        }
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    console.error('[student timetable GET]', error);
    return NextResponse.json({ error: 'Failed to fetch student timetable' }, { status: 500 });
  }
}