// src/app/api/student/profile/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user and include their nested profile data
    const profileData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        studentProfile: {
          include: {
            course: true,
            enrollments: {
              include: { unit: true }
            }
          }
        }
      }
    });

    if (!profileData || !profileData.studentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profileData, { status: 200 });
  } catch (error) {
    console.error('[student profile GET]', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}