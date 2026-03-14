// src/app/api/users/students/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, regNumber, year, courseId } = body;

    if (!name || !email || !regNumber || !year || !courseId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Update the User and their linked StudentProfile simultaneously
    const updatedStudent = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        studentProfile: {
          update: {
            regNumber,
            year: parseInt(year),
            courseId
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    return NextResponse.json(updatedStudent, { status: 200 });
  } catch (error) {
    console.error("Failed to update student:", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A student with this email or Reg Number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // Deleting the User will automatically delete the StudentProfile due to onDelete: Cascade
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Student deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}