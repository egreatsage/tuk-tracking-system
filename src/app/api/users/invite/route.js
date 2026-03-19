// src/app/api/users/invite/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const session = await auth();
    // Allow either a STUDENT inviting their parent, or an ADMIN doing it manually
    if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Get the exact student profile ID to link the parent to
    let targetStudentId = null;
    if (session.user.role === 'STUDENT') {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id }
      });
      if (!studentProfile) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      targetStudentId = studentProfile.id;
    } else {
      // If admin is sending it, they would provide the studentId in the body
      targetStudentId = body.studentId; 
    }

    // 2. Generate a secure, single-use token
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // 3. Set expiration to 72 hours from now
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // 4. Save to database
    const invite = await prisma.inviteToken.create({
      data: {
        token: rawToken,
        email: email,
        role: 'PARENT',
        studentId: targetStudentId,
        expires: expires,
      }
    });

    // 5. Construct the invite link
    // In production, you would use Resend to actually email this link.
    // For MVP, we will return it to the frontend to easily test it.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/invite?token=${rawToken}`;

    return NextResponse.json({ 
      success: true, 
      message: 'Invite generated successfully',
      inviteLink // Returning this so we can test the flow without an email provider
    }, { status: 201 });

  } catch (error) {
    console.error('[invite POST]', error);
    return NextResponse.json({ error: 'Failed to generate invite' }, { status: 500 });
  }
}