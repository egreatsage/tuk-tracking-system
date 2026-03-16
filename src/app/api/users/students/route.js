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
    
    // 1. Create the User AND the StudentProfile FIRST
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

    // 2. Fetch all units that belong to the course the student just selected
    const courseUnits = await prisma.unit.findMany({
      where: { courseId: courseId } // Fix: Use the courseId from the request body
    });

    // 3. Map those units into an array of enrollment objects using the newly generated profile ID
    const enrollmentData = courseUnits.map((unit) => ({
      studentId: newStudent.studentProfile.id, // Fix: Use the ID from the newly created student
      unitId: unit.id
    }));

    // 4. Bulk insert them into the UnitEnrollment table
    if (enrollmentData.length > 0) {
      await prisma.unitEnrollment.createMany({
        data: enrollmentData
      });
    }

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("Failed to create student:", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A student with this email or Reg Number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}