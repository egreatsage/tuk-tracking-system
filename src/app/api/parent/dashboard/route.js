// src/app/api/parent/dashboard/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the parent profile and all nested child data
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: true,
                course: true,
                // Fetch recent attendance records
                attendances: {
                  include: {
                    lecture: { include: { unit: true } }
                  },
                  orderBy: [
                    { lecture: { date: 'desc' } },
                    { lecture: { time: 'desc' } }
                  ],
                  take: 15 // Limit to recent 15 to keep payload light
                },
                // Fetch ONLY graded submissions (parents don't need to see pending work)
                submissions: {
                  where: { marks: { not: null } },
                  include: {
                    assessment: { include: { unit: true } }
                  },
                  orderBy: { submittedAt: 'desc' },
                  take: 10
                }
              }
            }
          }
        }
      }
    });

    if (!parentProfile) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    // Map over the join table to return a clean array of students
    const childrenData = parentProfile.children.map(relation => relation.student);

    return NextResponse.json(childrenData, { status: 200 });
  } catch (error) {
    console.error('[parent dashboard GET]', error);
    return NextResponse.json({ error: 'Failed to fetch parent data' }, { status: 500 });
  }
}