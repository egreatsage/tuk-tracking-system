// src/app/api/venues/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Remember the curly braces!
import { auth } from "@/auth";

export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Unwrap the params Promise
    const resolvedParams = await params;
    const blockId = resolvedParams.id;
    
    const { name, latitude, longitude, radius } = await req.json();

    const updatedBlock = await prisma.block.update({
      where: { id: blockId },
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius)
      }
    });

    return NextResponse.json(updatedBlock);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update venue" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Unwrap the params Promise
    const resolvedParams = await params;
    const blockId = resolvedParams.id;

    await prisma.block.delete({
      where: { id: blockId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete venue" }, { status: 500 });
  }
}