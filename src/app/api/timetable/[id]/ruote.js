// src/app/api/timetable/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    // Remember to await params in Next.js 15+
    const { id } = await params; 

    if (!id) {
      return NextResponse.json({ error: "Timetable slot ID is required" }, { status: 400 });
    }

    // Delete the specific timetable slot
    await prisma.timetableSlot.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Class removed from timetable successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete timetable slot:", error);
    return NextResponse.json({ error: "Failed to remove class from timetable" }, { status: 500 });
  }
}