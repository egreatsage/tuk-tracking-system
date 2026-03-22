// src/app/api/student/attendance/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth"; // Assuming NextAuth setup
import { calculateDistance } from "@/lib/geo"; // Your Haversine formula utility

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lectureId, otp, studentLat, studentLng } = await req.json();

    // Fetch the lecture, including the Room and Block for coordinates
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        room: {
          include: { block: true }
        }
      }
    });

    if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

    // 1. Verify OTP
    if (lecture.otpCode !== otp) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    // 2. Verify Expiration
    if (new Date() > new Date(lecture.otpExpiresAt)) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // 3. Verify Geolocation (Geofencing) using the Block's coordinates
    const { latitude: blockLat, longitude: blockLng, radius } = lecture.room.block;
    
    const distance = calculateDistance(
      studentLat, studentLng,
      blockLat, blockLng
    );

    // Dynamic radius check based on the building size
    if (distance > radius) {
       return NextResponse.json({ 
         error: `You are too far from ${lecture.room.block.name}. Distance: ${Math.round(distance)}m` 
       }, { status: 403 });
    }

    // 4. Upsert Attendance
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    const attendance = await prisma.attendance.upsert({
      where: {
        lectureId_studentId: { 
          lectureId: lecture.id, 
          studentId: studentProfile.id 
        }
      },
      update: { status: "PRESENT" },
      create: {
        lectureId: lecture.id,
        studentId: studentProfile.id,
        status: "PRESENT"
      }
    });

    return NextResponse.json({ success: true, attendance });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}