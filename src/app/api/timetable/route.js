// src/app/api/timetable/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const slots = await prisma.timetableSlot.findMany({
      include: {
        unit: { include: { course: true } },
        teacher: { include: { user: true } }
      },
      orderBy: [ { day: 'asc' }, { startTime: 'asc' } ]
    });
    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch timetable" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { unitId, teacherId, day, startTime, endTime, venue } = body;

    if (!unitId || !teacherId || !day || !startTime || !endTime || !venue) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check 1: Time Sanity
    if (startTime >= endTime) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Fetch existing slots for this specific day to check for collisions
    const existingSlots = await prisma.timetableSlot.findMany({
      where: { day },
      include: {
        unit: true,
        teacher: { include: { user: true } }
      }
    });

    // We need the requested unit's courseId to check for student overlaps
    const requestedUnit = await prisma.unit.findUnique({ where: { id: unitId } });

    // Run the Collision Checks
    for (const slot of existingSlots) {
      // Overlap Mathematical Logic: (StartA < EndB) and (EndA > StartB)
      if (startTime < slot.endTime && endTime > slot.startTime) {
        
        // Check 2: Venue Double Booking
        if (slot.venue.toLowerCase() === venue.toLowerCase()) {
          return NextResponse.json({ 
            error: `Venue Conflict: ${venue} is already booked for ${slot.unit.code} (${slot.startTime} - ${slot.endTime})` 
          }, { status: 400 });
        }

        // Check 3: Teacher Double Booking
        if (slot.teacherId === teacherId) {
          return NextResponse.json({ 
            error: `Teacher Conflict: ${slot.teacher.user.name} is already teaching ${slot.unit.code} at this time` 
          }, { status: 400 });
        }

        // Check 4: Student/Course Double Booking
        if (slot.unit.courseId === requestedUnit.courseId) {
          return NextResponse.json({ 
            error: `Course Conflict: Students are already scheduled for ${slot.unit.code} at this time` 
          }, { status: 400 });
        }
      }
    }

    // If all checks pass, save to database!
    const newSlot = await prisma.timetableSlot.create({
      data: { unitId, teacherId, day, startTime, endTime, venue }
    });

    return NextResponse.json(newSlot, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error creating slot" }, { status: 500 });
  }
}