// src/app/api/assessments/[id]/submissions/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;

    // Fetch the assessment details and all related submissions (including the student's name)
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        unit: true,
        submissions: {
          include: {
            student: {
              include: { user: true }
            }
          },
          orderBy: { submittedAt: 'desc' }
        }
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json(assessment, { status: 200 });
  } catch (error) {
    console.error('[fetch submissions GET]', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}