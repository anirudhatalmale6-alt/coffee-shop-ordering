import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let config = await prisma.timeSlotConfig.findFirst();

    if (!config) {
      config = await prisma.timeSlotConfig.create({
        data: {
          startTime: '09:00',
          endTime: '22:00',
          slotDuration: 15,
          maxOrdersPerSlot: 5,
        },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching time slot config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slot config' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startTime, endTime, slotDuration, maxOrdersPerSlot } = body;

    let config = await prisma.timeSlotConfig.findFirst();

    if (config) {
      config = await prisma.timeSlotConfig.update({
        where: { id: config.id },
        data: {
          startTime,
          endTime,
          slotDuration: parseInt(slotDuration),
          maxOrdersPerSlot: parseInt(maxOrdersPerSlot),
        },
      });
    } else {
      config = await prisma.timeSlotConfig.create({
        data: {
          startTime,
          endTime,
          slotDuration: parseInt(slotDuration),
          maxOrdersPerSlot: parseInt(maxOrdersPerSlot),
        },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error updating time slot config:', error);
    return NextResponse.json(
      { error: 'Failed to update time slot config' },
      { status: 500 }
    );
  }
}
