import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const units = await prisma.unit.findMany({
      include: {
        course: { select: { name: true } },
        // Change 'teacher' to 'teachers'
        teachers: { 
          include: { user: { select: { name: true } } } 
        }
      },
      orderBy: { code: 'asc' }
    });
    return NextResponse.json(units, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Handle Bulk Insert
    if (Array.isArray(body)) {
      // Create units one by one because createMany does not support relational 'connect'
      for (const unit of body) {
        await prisma.unit.create({
          data: {
            code: unit.code,
            name: unit.name,
            courseId: unit.courseId,
            teachers: unit.teacherIds?.length > 0 
              ? { connect: unit.teacherIds.map(id => ({ id })) } 
              : undefined
          }
        });
      }
      return NextResponse.json({ message: "Units created" }, { status: 201 });
    }

    // Handle Single Insert
    const { code, name, courseId, teacherIds } = body;
    const newUnit = await prisma.unit.create({
      data: { 
        code, 
        name, 
        courseId, 
        teachers: teacherIds?.length > 0 ? { connect: teacherIds.map(id => ({ id })) } : undefined
      }
    });
    return NextResponse.json(newUnit, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}