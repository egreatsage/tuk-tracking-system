// src/app/api/teacher/units/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        units: { 
          include: { course: true } 
        }
      }
    });

    if (!teacher) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    return NextResponse.json(teacher.units, { status: 200 });
  } catch (error) {
    console.error('[teacher units GET]', error);
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
  }
}