// src/app/api/student/assessments/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get the student's profile and enrolled units
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { enrollments: true }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const enrolledUnitIds = studentProfile.enrollments.map(e => e.unitId);

    // 2. Fetch assessments for those units, INCLUDING the student's specific submission if it exists
    const assessments = await prisma.assessment.findMany({
      where: {
        unitId: { in: enrolledUnitIds }
      },
      include: {
        unit: true,
        submissions: {
          where: { studentId: studentProfile.id } // Only fetch THIS student's submission
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json(assessments, { status: 200 });
  } catch (error) {
    console.error('[student assessments GET]', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}