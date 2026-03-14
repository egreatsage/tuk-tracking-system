// src/app/api/users/teachers/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    // Fetch all users with the TEACHER role, and include their profile data
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      include: { teacherProfile: true },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(teachers, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, staffNumber, department } = body;

    // Basic validation
    if (!name || !email || !staffNumber || !department) {
      return NextResponse.json({ error: "Name, email, staff number, and department are required" }, { status: 400 });
    }

    // Hash a default password for the MVP phase
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create the User AND the TeacherProfile in one database transaction
    const newTeacher = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: 'TEACHER',
        teacherProfile: {
          create: {
            staffNumber,
            department
          }
        }
      },
      include: {
        teacherProfile: true
      }
    });

    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error) {
    console.error("Failed to create teacher:", error);
    // Handle unique constraint violations (e.g., email or staff number already exists)
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A user with this email or staff number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}