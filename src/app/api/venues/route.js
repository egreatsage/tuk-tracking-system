// src/app/api/venues/route.js
import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const blocks = await prisma.block.findMany({
      include: { rooms: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(blocks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, latitude, longitude, radius, rooms } = await req.json();

    // Create the Block and its Rooms in a single transaction
    const newBlock = await prisma.block.create({
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius) || 50,
        rooms: {
          create: rooms.map(room => ({
            name: room.name,
            capacity: parseInt(room.capacity) || null
          }))
        }
      },
      include: { rooms: true }
    });

    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create venue" }, { status: 500 });
  }
}