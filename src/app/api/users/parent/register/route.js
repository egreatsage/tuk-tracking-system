// src/app/api/users/parent/register/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // 1. Verify the token exists and is valid
    const inviteRecord = await prisma.inviteToken.findUnique({
      where: { token: token }
    });

    if (!inviteRecord) {
      return NextResponse.json({ error: 'Invalid or missing invite token' }, { status: 404 });
    }

    if (new Date() > inviteRecord.expires) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 });
    }

    // 2. Check if the parent already has an account using this email
    let existingUser = await prisma.user.findUnique({
      where: { email: inviteRecord.email },
      include: { parentProfile: true }
    });

    if (existingUser) {
      if (existingUser.role !== 'PARENT') {
        return NextResponse.json({ error: 'Email is in use by a non-parent account' }, { status: 400 });
      }

      // Parent exists: Create a new link in the ParentStudent join table using the 'children' relation
      await prisma.parentProfile.update({
        where: { id: existingUser.parentProfile.id },
        data: {
          children: {
            create: {
              studentId: inviteRecord.studentId
            }
          }
        }
      });
    } else {
      // New Parent: Create User, ParentProfile, and the ParentStudent join record via 'children'
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.create({
        data: {
          name,
          email: inviteRecord.email,
          hashedPassword,
          role: 'PARENT',
          parentProfile: {
            create: {
              children: {
                create: {
                  studentId: inviteRecord.studentId
                }
              }
            }
          }
        }
      });
    }

    // 3. Delete the token so it cannot be used again
    await prisma.inviteToken.delete({
      where: { id: inviteRecord.id }
    });

    return NextResponse.json({ success: true, message: 'Account registered and linked!' }, { status: 201 });

  } catch (error) {
    console.error('[parent register POST]', error);
    return NextResponse.json({ error: 'Failed to register account' }, { status: 500 });
  }
}