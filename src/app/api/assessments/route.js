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

    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error) {
    console.error('[assessments POST]', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}