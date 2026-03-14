// src/app/api/users/students/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    // Fetch all users with the STUDENT role
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { 
        studentProfile: {
          include: {
            course: { select: { name: true } } // Fetch the course name
          }
        } 
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, regNumber, year, courseId } = body;

    if (!name || !email || !regNumber || !year || !courseId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Hash a default password for the MVP phase
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create the User AND the StudentProfile in one transaction
    const newStudent = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: 'STUDENT',
        studentProfile: {
          create: {
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

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("Failed to create student:", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A student with this email or Reg Number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}