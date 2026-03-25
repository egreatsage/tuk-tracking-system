import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lectureId } = await params;

    // 1. Get the lecture to find out which unit it belongs to
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { unitId: true }
    });

    if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

    // 2. Count total students enrolled in this unit
    const totalEnrolled = await prisma.unitEnrollment.count({
      where: { unitId: lecture.unitId }
    });

    // 3. Count how many have marked PRESENT
    const presentCount = await prisma.attendance.count({
      where: { 
        lectureId: lectureId,
        status: "PRESENT"
      }
    });

    return NextResponse.json({ presentCount, totalEnrolled });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}