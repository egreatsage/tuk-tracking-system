import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // <-- Import the shared singleton

export async function GET(request) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { units: true, students: true } }
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Handle Bulk Insert (Array)
    if (Array.isArray(body)) {
      if (body.length === 0) return NextResponse.json({ error: "Empty payload" }, { status: 400 });
      
      const newCourses = await prisma.course.createMany({
        data: body.map(course => ({ name: course.name })),
        skipDuplicates: true, // Ignores entries that violate the unique constraint
      });

      return NextResponse.json({ message: `Successfully created ${newCourses.count} courses` }, { status: 201 });
    }

    // Handle Single Insert (Object)
    const { name } = body;
    if (!name) return NextResponse.json({ error: "Course name is required" }, { status: 400 });

    const newCourse = await prisma.course.create({ data: { name } });
    return NextResponse.json(newCourse, { status: 201 });

  } catch (error) {
    console.error("Failed to create course(s):", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A course with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create course(s)" }, { status: 500 });
  }
}