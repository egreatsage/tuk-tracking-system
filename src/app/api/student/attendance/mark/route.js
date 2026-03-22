// src/app/api/student/attendance/mark/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper function: Haversine formula to get distance in meters
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized. Students only." }, { status: 401 });
    }

    // NEW: We now expect latitude and longitude from the student's phone
    const { code, lectureId, latitude: studentLat, longitude: studentLon } = await request.json();

    if (!code) return NextResponse.json({ error: "Attendance code is required" }, { status: 400 });
    
    if (!studentLat || !studentLon) {
      return NextResponse.json({ error: "Location access is required to mark attendance." }, { status: 400 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!studentProfile) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    // NEW: Include the room and block data so we can check the coordinates
    const lecture = await prisma.lecture.findFirst({
      where: {
        otpCode: code,
        otpExpiresAt: { gt: new Date() },
        ...(lectureId ? { id: lectureId } : {})
      },
      include: {
        room: {
          include: { block: true }
        }
      }
    });

    if (!lecture) {
      return NextResponse.json({ error: "Invalid or expired attendance code." }, { status: 400 });
    }

    // --- GEOLOCATION CHECK ---
    const blockLat = lecture.room.block.latitude;
    const blockLon = lecture.room.block.longitude;
    const allowedRadius = lecture.room.block.radius; // Defaults to 50 in your schema

    const distance = getDistanceFromLatLonInMeters(studentLat, studentLon, blockLat, blockLon);

    if (distance > allowedRadius) {
      return NextResponse.json({ 
        error: `You are too far from the classroom to check in. Please move closer. (${Math.round(distance)} meters away)` 
      }, { status: 403 });
    }
    // -------------------------

    const existingAttendance = await prisma.attendance.findFirst({
      where: { lectureId: lecture.id, studentId: studentProfile.id }
    });

    if (existingAttendance) {
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { status: "PRESENT", reason: null }
      });
    } else {
      await prisma.attendance.create({
        data: {
          lectureId: lecture.id,
          studentId: studentProfile.id,
          status: "PRESENT"
        }
      });
    }

    return NextResponse.json({ success: true, message: "Attendance marked successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Failed to mark attendance:", error);
    return NextResponse.json({ error: "Server error marking attendance" }, { status: 500 });
  }
}