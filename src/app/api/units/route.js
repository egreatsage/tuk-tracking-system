import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // <-- Import the shared singleton

export async function GET(request) {
  try {
    const units = await prisma.unit.findMany({
      include: {
        course: { select: { name: true } }
      },
      orderBy: { code: 'asc' }
    });
    
    return NextResponse.json(units, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch units:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Handle Bulk Insert (Array)
    if (Array.isArray(body)) {
      if (body.length === 0) return NextResponse.json({ error: "Empty payload" }, { status: 400 });
      
      const newUnits = await prisma.unit.createMany({
        data: body.map(unit => ({
          code: unit.code,
          name: unit.name,
          courseId: unit.courseId
        })),
        skipDuplicates: true, 
      });

      return NextResponse.json({ message: `Successfully created ${newUnits.count} units` }, { status: 201 });
    }

    // Handle Single Insert (Object)
    const { code, name, courseId } = body;
    if (!code || !name || !courseId) {
      return NextResponse.json({ error: "Code, name, and courseId are required" }, { status: 400 });
    }

    const newUnit = await prisma.unit.create({
      data: { code, name, courseId }
    });
    return NextResponse.json(newUnit, { status: 201 });

  } catch (error) {
    console.error("Failed to create unit(s):", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A unit with this code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create unit(s)" }, { status: 500 });
  }
}