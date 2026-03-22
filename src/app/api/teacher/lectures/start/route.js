// src/app/api/teacher/lectures/start/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { timetableSlotId } = await request.json();

    // 1. Fetch the blueprint (TimetableSlot)
    const slot = await prisma.timetableSlot.findUnique({
      where: { id: timetableSlotId }
    });

    if (!slot) return NextResponse.json({ error: "Timetable slot not found" }, { status: 404 });

    // 2. Generate OTP and Expiry (Valid for 10 minutes)
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString(); // Random 4 digits
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Now + 10 mins

    // 3. Get today's date (midnight) to prevent creating duplicate lectures for the same day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 4. Create or Update the Lecture for TODAY
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id }
    });

    // We look for an existing lecture for this slot today. If none, create it.
    const lecture = await prisma.lecture.create({
      data: {
        date: today,
        time: slot.startTime,
        roomId: slot.roomId,
        unitId: slot.unitId,
        teacherId: teacherProfile.id,
        otpCode,
        otpExpiresAt
      }
    });

    return NextResponse.json(lecture, { status: 200 });

  } catch (error) {
    console.error("Failed to start lecture:", error);
    return NextResponse.json({ error: "Server error starting lecture" }, { status: 500 });
  }
}