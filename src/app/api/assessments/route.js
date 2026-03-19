// src/app/api/assessments/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch assessments for units taught by this teacher
    const assessments = await prisma.assessment.findMany({
      where: {
        unit: {
          teachers: { some: { userId: session.user.id } }
        }
      },
      include: { unit: true },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json(assessments, { status: 200 });
  } catch (error) {
    console.error('[assessments GET]', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { unitId, type, title, instructions, fileUrl, dueDate, maxMarks } = body;

    if (!unitId || !type || !title || !dueDate || !maxMarks) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create the Assessment
    const newAssessment = await prisma.assessment.create({
      data: {
        unitId,
        type,
        title,
        instructions,
        fileUrl,
        dueDate: new Date(dueDate),
        maxMarks: parseFloat(maxMarks)
      },
      include: { unit: true }
    });

    // --- NOTIFICATION LOGIC ---

    // 2. Find all students enrolled in this specific unit
    const enrollments = await prisma.unitEnrollment.findMany({
      where: { unitId: unitId },
      include: { student: true }
    });

    if (enrollments.length > 0) {
      const studentIds = enrollments.map(e => e.student.id);
      const notificationsToCreate = [];

      // 3. Queue up notifications for all enrolled students
      enrollments.forEach(enrollment => {
        notificationsToCreate.push({
          userId: enrollment.student.userId,
          title: `New ${type} Posted`,
          message: `"${title}" has been posted for ${newAssessment.unit.code}. Due: ${new Date(dueDate).toLocaleDateString()}`,
          link: "/student/assignments"
        });
      });

      // 4. Find all parents linked to these enrolled students
      const linkedParents = await prisma.parentProfile.findMany({
        where: {
          children: {
            some: { studentId: { in: studentIds } }
          }
        }
      });

      // 5. Queue up notifications for the parents
      linkedParents.forEach(parent => {
        notificationsToCreate.push({
          userId: parent.userId,
          title: `New ${type} for your child`,
          message: `"${title}" was posted in ${newAssessment.unit.code}. Due: ${new Date(dueDate).toLocaleDateString()}`,
          link: "/parent"
        });
      });

      // 6. Bulk insert all notifications at once for maximum performance
      if (notificationsToCreate.length > 0) {
        await prisma.notification.createMany({
          data: notificationsToCreate
        });
      }
    }

    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error) {
    console.error('[assessments POST]', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}