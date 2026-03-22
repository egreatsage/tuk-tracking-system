// src/app/api/student/attendance/mark/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized. Students only." }, { status: 401 });
    }

    const { code, lectureId } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Attendance code is required" }, { status: 400 });
    }

    // 1. Get Student Profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // 2. Find the active lecture matching the code
    const lecture = await prisma.lecture.findFirst({
      where: {
        otpCode: code,
        otpExpiresAt: { gt: new Date() }, // Ensure the code hasn't expired
        ...(lectureId ? { id: lectureId } : {}) // Extra safety if scanned via QR
      }
    });

    if (!lecture) {
      return NextResponse.json({ error: "Invalid or expired attendance code." }, { status: 400 });
    }

    // 3. Mark the student as PRESENT (Create or Update the attendance record)
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        lectureId: lecture.id,
        studentId: studentProfile.id
      }
    });

    if (existingAttendance) {
      // If a record already exists (maybe teacher manually marked them early), update it
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { status: "PRESENT", reason: null }
      });
    } else {
      // Otherwise, create a new attendance record
      await prisma.attendance.create({
        data: {
          lectureId: lecture.id,
          studentId: studentProfile.id,
          status: "PRESENT",
          date: lecture.date
        }
      });
    }

    return NextResponse.json({ success: true, message: "Attendance marked successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Failed to mark attendance:", error);
    return NextResponse.json({ error: "Server error marking attendance" }, { status: 500 });
  }
}