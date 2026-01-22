import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTimeSlots } from '@/lib/utils';

export async function GET() {
  try {
    // Get time slot configuration
    let config = await prisma.timeSlotConfig.findFirst();

    // Create default config if none exists
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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count orders per time slot for today
    const orders = await prisma.order.findMany({
      where: {
        pickupTime: {
          gte: today,
          lt: tomorrow,
        },
        paymentStatus: 'PAID',
        status: {
          notIn: ['CANCELLED'],
        },
      },
      select: {
        pickupTime: true,
      },
    });

    // Build a map of booked slots
    const bookedSlots = new Map<string, number>();
    orders.forEach((order) => {
      const timeStr = `${order.pickupTime.getHours().toString().padStart(2, '0')}:${order.pickupTime.getMinutes().toString().padStart(2, '0')}`;
      bookedSlots.set(timeStr, (bookedSlots.get(timeStr) || 0) + 1);
    });

    const slots = getTimeSlots(
      config.startTime,
      config.endTime,
      config.slotDuration,
      bookedSlots,
      config.maxOrdersPerSlot
    );

    return NextResponse.json({
      slots,
      config: {
        startTime: config.startTime,
        endTime: config.endTime,
        slotDuration: config.slotDuration,
      },
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  }
}
