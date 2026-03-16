// src/app/api/attendance/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { unitId, date, time, venue, attendanceData } = body;

    if (!unitId || !date || !time || !attendanceData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the teacher's profile ID using their session ID
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id }
    });

    // 1. Find existing lecture, or create a new one for this specific class instance
    // Note: 'date' comes from the calendar click, 'time' is the slot's start time
    let lecture = await prisma.lecture.findFirst({
      where: { 
        unitId, 
        date: new Date(date), 
        time 
      }
    });

    if (!lecture) {
      lecture = await prisma.lecture.create({
        data: {
          date: new Date(date),
          time,
          venue: venue || 'TBD',
          unitId,
          teacherId: teacher.id
        }
      });
    }

    // 2. Process all attendance records using a Prisma Transaction
    // Upsert ensures we update existing records if the teacher edits attendance later
    const attendanceOperations = attendanceData.map((record) => {
      return prisma.attendance.upsert({
        where: {
          lectureId_studentId: {
            lectureId: lecture.id,
            studentId: record.studentId,
          }
        },
        update: { status: record.status,reason: record.reason || null },
        create: {
          lectureId: lecture.id,
          studentId: record.studentId,
          status: record.status,
          reason: record.reason || null
        }
      });
    });

    await prisma.$transaction(attendanceOperations);

    return NextResponse.json({ success: true, message: 'Attendance saved' }, { status: 200 });
  } catch (error) {
    console.error('[attendance POST]', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}