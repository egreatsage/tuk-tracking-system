// src/app/api/units/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, courseId } = body;

    if (!code || !name || !courseId) {
      return NextResponse.json({ error: "Code, name, and courseId are required" }, { status: 400 });
    }

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: { code, name, courseId }
    });

    return NextResponse.json(updatedUnit, { status: 200 });
  } catch (error) {
    console.error("Failed to update unit:", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A unit with this code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    await prisma.unit.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Unit deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete unit:", error);
    return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}