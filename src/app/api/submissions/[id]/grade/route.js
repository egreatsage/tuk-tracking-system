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

    const resolvedParams = await params;
    const submissionId = resolvedParams.id;

    const body = await request.json();
    const { marks, feedback } = body;

    if (marks === undefined || marks === null) {
      return NextResponse.json({ error: 'Marks are required' }, { status: 400 });
    }

    // 1. Update the submission and fetch the related Student and Assessment details
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        marks: parseFloat(marks),
        feedback: feedback || null,
      },
      include: {
        student: true,
        assessment: { include: { unit: true } }
      }
    });

    // 2. Prepare the Notification details
    const assessmentName = updatedSubmission.assessment.title;
    const unitCode = updatedSubmission.assessment.unit.code;
    const scoreText = `${marks}/${updatedSubmission.assessment.maxMarks}`;
    
    // 3. Create a notification for the STUDENT
    await prisma.notification.create({
      data: {
        userId: updatedSubmission.student.userId,
        title: "New Grade Posted",
        message: `Your grade for ${assessmentName} (${unitCode}) has been posted. You scored ${scoreText}.`,
        link: "/student/assignments"
      }
    });

    // 4. Find any PARENTS linked to this student
    const linkedParents = await prisma.parentProfile.findMany({
      where: {
        children: {
          some: { studentId: updatedSubmission.studentId }
        }
      }
    });

    // 5. Send a notification to EACH linked parent
    if (linkedParents.length > 0) {
      const parentNotifications = linkedParents.map(parent => {
        return prisma.notification.create({
          data: {
            userId: parent.userId,
            title: "Student Grade Update",
            message: `A new grade was posted for ${assessmentName} (${unitCode}). Score: ${scoreText}.`,
            link: "/parent"
          }
        });
      });
      // Run all parent notifications in parallel
      await Promise.all(parentNotifications);
    }

    return NextResponse.json(updatedSubmission, { status: 200 });
  } catch (error) {
    console.error('[grade submission PATCH]', error);
    return NextResponse.json({ error: 'Failed to save grade and send notifications' }, { status: 500 });
  }
}