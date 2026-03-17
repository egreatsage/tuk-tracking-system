// src/app/api/submissions/[id]/grade/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: submissionId } = await params;
    const body = await request.json();
    const { marks, feedback } = body;

    if (marks === undefined || marks === null) {
      return NextResponse.json({ error: 'Marks are required' }, { status: 400 });
    }

    // Update the submission with the teacher's grade and feedback
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        marks: parseFloat(marks),
        feedback: feedback || null,
      }
    });

    return NextResponse.json(updatedSubmission, { status: 200 });
  } catch (error) {
    console.error('[grade submission PATCH]', error);
    return NextResponse.json({ error: 'Failed to save grade' }, { status: 500 });
  }
}
