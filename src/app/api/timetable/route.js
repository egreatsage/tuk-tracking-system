// src/app/api/timetable/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const START_OF_DAY = '07:00';
const END_OF_DAY   = '20:00';
const TIME_REGEX   = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET(request) {
  try {
    const slots = await prisma.timetableSlot.findMany({
      include: {
        unit:    { include: { course: true } },
        teacher: { include: { user: true   } },
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });
    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // ── Parse body FIRST — everything depends on this ────────────────────────
    const body = await request.json();
    const { courseId, unitId, teacherId, day, startTime, endTime, venue } = body;

    // ── 0. All fields present ────────────────────────────────────────────────
    if (!courseId || !unitId || !teacherId || !day || !startTime || !endTime || !venue) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // ── 0a. Normalise day casing ─────────────────────────────────────────────
    const normalizedDay = day.toUpperCase();

    // ── 0b. Time format validation ───────────────────────────────────────────
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      return NextResponse.json(
        { error: 'Times must be in HH:MM 24-hour format.' },
        { status: 400 },
      );
    }

    // ── Check 1: Time sanity ─────────────────────────────────────────────────
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time.' },
        { status: 400 },
      );
    }

    // ── Check 2: Working hours / valid day ───────────────────────────────────
    if (!VALID_DAYS.includes(normalizedDay)) {
      return NextResponse.json(
        { error: `Invalid day "${day}". Must be a weekday (Monday – Friday).` },
        { status: 400 },
      );
    }
    if (startTime < START_OF_DAY || endTime > END_OF_DAY) {
      return NextResponse.json(
        { error: `Slots must fall between ${START_OF_DAY} and ${END_OF_DAY}.` },
        { status: 400 },
      );
    }

    // ── Check 3a: Course exists ──────────────────────────────────────────────
    const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
    if (!courseExists) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    // ── Check 3b: Unit belongs to the declared course ────────────────────────
    const requestedUnit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!requestedUnit) {
      return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
    }
    if (requestedUnit.courseId !== courseId) {
      return NextResponse.json(
        { error: `Integrity error: unit "${requestedUnit.code}" does not belong to the selected course.` },
        { status: 400 },
      );
    }

    // ── Fetch only truly overlapping slots (all remaining checks) ────────────
    //    Overlap condition: startA < endB  AND  endA > startB
    const overlapping = await prisma.timetableSlot.findMany({
      where: {
        day: normalizedDay,
        startTime: { lt: endTime   },
        endTime:   { gt: startTime },
      },
      include: {
        unit:    true,
        teacher: { include: { user: true } },
      },
    });

    for (const slot of overlapping) {
      // Check 4: Venue double-booking ────────────────────────────────────────
      if (slot.venue.toLowerCase() === venue.toLowerCase()) {
        return NextResponse.json(
          {
            error: `Venue conflict: "${venue}" is already booked for ${slot.unit.code} (${slot.startTime}–${slot.endTime}).`,
          },
          { status: 400 },
        );
      }

      // Check 5: Teacher double-booking ──────────────────────────────────────
      if (slot.teacherId === teacherId) {
        return NextResponse.json(
          {
            error: `Teacher conflict: ${slot.teacher.user.name} is already teaching ${slot.unit.code} at this time.`,
          },
          { status: 400 },
        );
      }

      // Check 6: Same-course student clash ───────────────────────────────────
      if (slot.unit.courseId === requestedUnit.courseId) {
        return NextResponse.json(
          {
            error: `Course conflict: students in this course are already scheduled for ${slot.unit.code} at this time.`,
          },
          { status: 400 },
        );
      }

      // Check 7: Duplicate slot (same unit scheduled again at the same time) ─
      if (slot.unitId === unitId) {
        return NextResponse.json(
          {
            error: `Duplicate conflict: ${requestedUnit.code} is already scheduled on ${normalizedDay} at ${slot.startTime}–${slot.endTime}.`,
          },
          { status: 400 },
        );
      }
    }

    // ── Check 8: Cross-course student clash (shared / elective units) ────────
    const overlappingUnitIds = overlapping.map((s) => s.unitId);

    if (overlappingUnitIds.length > 0) {
      const newUnitEnrollments = await prisma.unitEnrollment.findMany({
        where: { unitId },
        select: { studentId: true },
      });
      const newStudentIds = newUnitEnrollments.map((e) => e.studentId);

      if (newStudentIds.length > 0) {
        for (const conflictUnitId of overlappingUnitIds) {
          const clash = await prisma.unitEnrollment.findFirst({
            where: {
              unitId:    conflictUnitId,
              studentId: { in: newStudentIds },
            },
          });

          if (clash) {
            const conflictSlot = overlapping.find((s) => s.unitId === conflictUnitId);
            const clashCount   = await prisma.unitEnrollment.count({
              where: { unitId: conflictUnitId, studentId: { in: newStudentIds } },
            });
            return NextResponse.json(
              {
                error: `Student conflict: ${clashCount} student(s) enrolled in ${requestedUnit.code} are also enrolled in ${conflictSlot.unit.code}, which is scheduled at this time.`,
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // ── All checks passed — persist ──────────────────────────────────────────
    const newSlot = await prisma.timetableSlot.create({
      data: { courseId, unitId, teacherId, day: normalizedDay, startTime, endTime, venue },
    });

    return NextResponse.json(newSlot, { status: 201 });
  } catch (error) {
    console.error('[timetable POST]', error);
    return NextResponse.json({ error: 'Server error creating slot.' }, { status: 500 });
  }
}