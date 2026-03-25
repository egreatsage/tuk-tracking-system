import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: true,
                course: true,
                // Fetch ALL attendances for statistics and history
                attendances: {
                  include: {
                    lecture: { include: { unit: true } }
                  },
                  orderBy: [
                    { lecture: { date: 'desc' } },
                    { lecture: { time: 'desc' } }
                  ]
                },
                // Fetch ALL submissions (completed assignments)
                submissions: {
                  include: {
                    assessment: { include: { unit: true } }
                  },
                  orderBy: { submittedAt: 'desc' }
                },
                // Fetch ENROLLMENTS to get Units, Teachers, and all Assessments
                enrollments: {
                  include: {
                    unit: {
                      include: {
                        teachers: {
                          include: {
                            user: { select: { name: true, email: true } }
                          }
                        },
                        assessments: true // To calculate pending assignments
                      }
                    }
                  }
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

    const childrenData = parentProfile.children.map(relation => relation.student);

    return NextResponse.json(childrenData, { status: 200 });
  } catch (error) {
    console.error('[parent dashboard GET]', error);
    return NextResponse.json({ error: 'Failed to fetch parent data' }, { status: 500 });
  }
}