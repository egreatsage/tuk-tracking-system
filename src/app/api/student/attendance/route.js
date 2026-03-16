// src/app/api/student/attendance/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get the student's profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Fetch the units they are enrolled in (so they can filter by unit)
    const enrollments = await prisma.unitEnrollment.findMany({
      where: { studentId: studentProfile.id },
      include: {
        unit: true
      }
    });

    // 3. Fetch all their personal attendance records
    const attendances = await prisma.attendance.findMany({
      where: { studentId: studentProfile.id },
      include: {
        lecture: {
          include: { unit: true } // Need the unit info to group records
        }
      },
      orderBy: [
        { lecture: { date: 'desc' } },
        { lecture: { time: 'desc' } }
      ]
    });

    return NextResponse.json({ 
      units: enrollments.map(e => e.unit), 
      attendances 
    }, { status: 200 });

  } catch (error) {
    console.error('[student attendance GET]', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}