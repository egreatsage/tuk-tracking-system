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
    const { teacherId, day, startTime, endTime, venue } = body;
    console.log('[PATCH received]', { id, teacherId, day, startTime, endTime, venue });

    const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
    const VALID_DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'];

    if (!teacherId || !day || !startTime || !endTime || !venue) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
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

    // Get the existing slot so we know its unitId/courseId for conflict checks
    const existing = await prisma.timetableSlot.findUnique({ where: { id }, include: { unit: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Slot not found.' }, { status: 404 });
    }

    // Check overlapping slots — same logic as POST, but exclude the current slot being edited
    const overlapping = await prisma.timetableSlot.findMany({
      where: {
        day: normalizedDay,
        id:  { not: id },           // exclude self
        startTime: { lt: endTime },
        endTime:   { gt: startTime },
      },
      include: { unit: true, teacher: { include: { user: true } } },
    });

    console.log('[overlapping slots]', overlapping.map(s => ({
  id: s.id,
  unitCode: s.unit.code,
  teacherId: s.teacherId,
  startTime: s.startTime,
  endTime: s.endTime,
})));

    for (const slot of overlapping) {
      if (slot.venue.toLowerCase() === venue.toLowerCase()) {
        return NextResponse.json({ error: `Venue conflict: "${venue}" is already booked for ${slot.unit.code} (${slot.startTime}–${slot.endTime}).` }, { status: 400 });
      }
      if (slot.teacherId === teacherId) {
        return NextResponse.json({ error: `Teacher conflict: ${slot.teacher.user.name} is already teaching at this time.` }, { status: 400 });
      }
      if (slot.unit.courseId === existing.unit.courseId) {
        return NextResponse.json({ error: `Course conflict: students are already scheduled for ${slot.unit.code} at this time.` }, { status: 400 });
      }
    }

    const updated = await prisma.timetableSlot.update({
      where: { id },
      data: { teacherId, day: normalizedDay, startTime, endTime, venue },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[timetable PATCH]', error);
    return NextResponse.json({ error: 'Server error updating slot.' }, { status: 500 });
  }
}