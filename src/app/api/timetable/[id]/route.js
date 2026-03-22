// src/app/api/timetable/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    // Remember to await params in Next.js 15+
    const { id } = await params; 

    if (!id) {
      return NextResponse.json({ error: "Timetable slot ID is required" }, { status: 400 });
    }

    // Delete the specific timetable slot
    await prisma.timetableSlot.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Class removed from timetable successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete timetable slot:", error);
    return NextResponse.json({ error: "Failed to remove class from timetable" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Slot ID is required.' }, { status: 400 });
    }

    const body = await request.json();
    
    // 1. Swapped 'venue' for 'roomId'
    const { teacherId, day, startTime, endTime, roomId } = body;
    console.log('[PATCH received]', { id, teacherId, day, startTime, endTime, roomId });

    const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
    const VALID_DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'];

    // 2. Ensure roomId is provided
    if (!teacherId || !day || !startTime || !endTime || !roomId) {
      return NextResponse.json({ error: 'All fields, including a Room, are required.' }, { status: 400 });
    }
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      return NextResponse.json({ error: 'Times must be in HH:MM format.' }, { status: 400 });
    }

    const normalizedDay = day.toUpperCase();
    if (!VALID_DAYS.includes(normalizedDay)) {
      return NextResponse.json({ error: 'Invalid day.' }, { status: 400 });
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
    }

    // 3. Verify the Room actually exists
    const requestedRoom = await prisma.room.findUnique({ 
      where: { id: roomId }
    });
    if (!requestedRoom) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    // Get the existing slot so we know its unitId/courseId for conflict checks
    const existing = await prisma.timetableSlot.findUnique({ where: { id }, include: { unit: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Slot not found.' }, { status: 404 });
    }

    // Check overlapping slots — exclude the current slot being edited
    const overlapping = await prisma.timetableSlot.findMany({
      where: {
        day: normalizedDay,
        id:  { not: id },           // exclude self
        startTime: { lt: endTime },
        endTime:   { gt: startTime },
      },
      // 4. Include room to handle conflicts correctly
      include: { unit: true, room: true, teacher: { include: { user: true } } }, 
    });

    for (const slot of overlapping) {
      // 5. Check venue conflicts strictly by UUID instead of string comparison
      if (slot.roomId === roomId) {
        return NextResponse.json({ error: `Venue conflict: "${requestedRoom.name}" is already booked for ${slot.unit.code} (${slot.startTime}–${slot.endTime}).` }, { status: 400 });
      }
      if (slot.teacherId === teacherId) {
        return NextResponse.json({ error: `Teacher conflict: ${slot.teacher.user.name} is already teaching at this time.` }, { status: 400 });
      }
      if (slot.unit.courseId === existing.unit.courseId) {
        return NextResponse.json({ error: `Course conflict: students are already scheduled for ${slot.unit.code} at this time.` }, { status: 400 });
      }
    }

    // 6. Save the new roomId to the database
    const updated = await prisma.timetableSlot.update({
      where: { id },
      data: { teacherId, day: normalizedDay, startTime, endTime, roomId },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[timetable PATCH]', error);
    return NextResponse.json({ error: 'Server error updating slot.' }, { status: 500 });
  }
}