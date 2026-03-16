// src/app/api/submissions/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assessmentId, fileUrl, textAnswer } = body;

    if (!assessmentId || (!fileUrl && !textAnswer)) {
      return NextResponse.json({ error: 'Missing required submission data' }, { status: 400 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    // Use upsert so if a student resubmits before grading, it overwrites their old submission
    const submission = await prisma.submission.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId,
          studentId: studentProfile.id,
        }
      },
      update: {
        fileUrl,
        textAnswer,
        submittedAt: new Date(),
      },
      create: {
        assessmentId,
        studentId: studentProfile.id,
        fileUrl,
        textAnswer,
      }
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('[submissions POST]', error);
    return NextResponse.json({ error: 'Failed to submit work' }, { status: 500 });
  }
}