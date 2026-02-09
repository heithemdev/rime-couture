/**
 * GET /api/auth/notifications - Get email notification preference
 * PUT /api/auth/notifications - Toggle email notification preference
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { validateSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailNotifications: true },
    });

    return NextResponse.json({
      emailNotifications: user?.emailNotifications ?? true,
    });
  } catch (error) {
    console.error('[notifications] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { emailNotifications } = body;

    if (typeof emailNotifications !== 'boolean') {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { emailNotifications },
    });

    return NextResponse.json({ ok: true, emailNotifications });
  } catch (error) {
    console.error('[notifications] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
