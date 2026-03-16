// src/app/api/units/[id]/students/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: unitId } = await params;

    // Fetch enrollments and include the student's profile and user data (for their name)
    const enrollments = await prisma.unitEnrollment.findMany({
      where: { unitId },
      include: {
        student: {
          include: { user: true }
        }
      },
      orderBy: {
        student: { regNumber: 'asc' } // Sort by registration number
      }
    });

    // Map it to a clean array of students
    const students = enrollments.map(e => e.student);

    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error('[fetch students GET]', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}