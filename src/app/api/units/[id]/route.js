import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params; 
    const body = await request.json();
    const { code, name, courseId, teacherIds } = body;

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: { 
        code, 
        name, 
        courseId, 
        // 'set' replaces the existing array of teachers with the new array
        teachers: { set: (teacherIds || []).map(id => ({ id })) } 
      }
    });

    return NextResponse.json(updatedUnit, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params; // Awaiting params!
    await prisma.unit.delete({ where: { id } });
    return NextResponse.json({ message: "Unit deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete unit:", error);
    return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}