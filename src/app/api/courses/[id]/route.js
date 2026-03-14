// src/app/api/courses/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // Extract ID from URL
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Course name is required" }, { status: 400 });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(updatedCourse, { status: 200 });
  } catch (error) {
    console.error("Failed to update course:", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A course with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}