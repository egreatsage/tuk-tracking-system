// src/app/api/student/attendance/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET — fetch the current student's enrolled units + attendance records
export async function GET(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // FIX 1: Change prisma.enrollment to prisma.unitEnrollment
    const enrollments = await prisma.unitEnrollment.findMany({
      where: { studentId: studentProfile.id },
      include: { unit: true },
    });

    const units = enrollments.map((e) => e.unit);

    // Fetch all attendance records for this student, including lecture details
    const attendances = await prisma.attendance.findMany({
      where: { studentId: studentProfile.id },
      include: {
        lecture: {
          select: {
            id: true,
            unitId: true,
            date: true,
            time: true,
            // FIX 2: Replace 'venue: true' with the 'room' relation since venue was removed
            room: {
                select: {
                    name: true,
                    block: {
                        select: {
                            name: true
                        }
                    }
                }
            },
          },
        },
      },
      orderBy: { lecture: { date: "desc" } },
    });

    return NextResponse.json({ units, attendances });
  } catch (error) {
    console.error("Failed to fetch student attendance:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}