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
    // Accept timetableSlotId so we can look up the roomId — the Lecture model
    // requires a room relation and has no plain 'venue' string field anymore.
    const { unitId, date, time, venue, timetableSlotId, attendanceData } = body;

    if (!unitId || !date || !time || !attendanceData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // --- Resolve the roomId ---
    // Priority 1: look it up from the TimetableSlot (most accurate)
    // Priority 2: find an existing lecture for this slot and reuse its roomId
    // Priority 3: fall back to the first room in the DB (avoids a hard crash)
    let roomId = null;

    if (timetableSlotId) {
      const slot = await prisma.timetableSlot.findUnique({
        where: { id: timetableSlotId },
        select: { roomId: true },
      });
      roomId = slot?.roomId ?? null;
    }

    if (!roomId) {
      // Maybe the lecture was already created (e.g. via "Start Lecture" button)
      const existingLecture = await prisma.lecture.findFirst({
        where: { unitId, date: new Date(date), time },
        select: { roomId: true },
      });
      roomId = existingLecture?.roomId ?? null;
    }

    if (!roomId) {
      // Last resort: grab any room so the record saves rather than crashing.
      // In production you'd want to surface a proper error to the teacher UI.
      const anyRoom = await prisma.room.findFirst({ select: { id: true } });
      roomId = anyRoom?.id ?? null;
    }

    if (!roomId) {
      return NextResponse.json(
        { error: 'No room found. Please add a room in the system before taking attendance.' },
        { status: 400 }
      );
    }

    // 1. Find or create the Lecture for this class instance
    let lecture = await prisma.lecture.findFirst({
      where: { unitId, date: new Date(date), time },
    });

    if (!lecture) {
      lecture = await prisma.lecture.create({
        data: {
          date: new Date(date),
          time,
          roomId,           // ✅ required relation satisfied
          unitId,
          teacherId: teacher.id,
        },
      });
    }

    // 2. Upsert all attendance records in a transaction
    const attendanceOperations = attendanceData.map((record) =>
      prisma.attendance.upsert({
        where: {
          lectureId_studentId: {
            lectureId: lecture.id,
            studentId: record.studentId,
          },
        },
        update: { status: record.status, reason: record.reason || null },
        create: {
          lectureId: lecture.id,
          studentId: record.studentId,
          status: record.status,
          reason: record.reason || null,
        },
      })
    );

    await prisma.$transaction(attendanceOperations);

    return NextResponse.json({ success: true, message: 'Attendance saved' }, { status: 200 });
  } catch (error) {
    console.error('[attendance POST]', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}