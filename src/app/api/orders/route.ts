import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils';
import Razorpay from 'razorpay';

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerMobile,
      pickupLocationId,
      pickupTime,
      items,
    } = body;

    // Validate required fields
    if (!customerName || !customerMobile || !pickupLocationId || !pickupTime || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate mobile number (Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(customerMobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number' },
        { status: 400 }
      );
    }

    // Verify pickup location exists
    const location = await prisma.pickupLocation.findUnique({
      where: { id: pickupLocationId, isActive: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Invalid pickup location' },
        { status: 400 }
      );
    }

    // Verify menu items and calculate total
    const menuItemIds = items.map((item: { menuItemId: string }) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        isActive: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { error: 'One or more menu items are unavailable' },
        { status: 400 }
      );
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems = items.map((item: { menuItemId: string; quantity: number; cupNames: string[] }) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
      totalAmount += menuItem.price * item.quantity;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        cupNames: item.cupNames || [],
      };
    });

    // Parse pickup time
    const [hours, minutes] = pickupTime.split(':').map(Number);
    const pickupDateTime = new Date();
    pickupDateTime.setHours(hours, minutes, 0, 0);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create Razorpay order
    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        customerName,
        customerMobile,
      },
    });

    // Create order in database with PENDING payment status
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerMobile,
        pickupLocationId,
        pickupTime: pickupDateTime,
        totalAmount,
        paymentStatus: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        pickupLocation: true,
      },
    });

    return NextResponse.json({
      order,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: Math.round(totalAmount * 100),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          pickupLocation: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ order });
    }

    if (orderNumber) {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          pickupLocation: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ order });
    }

    return NextResponse.json(
      { error: 'Order ID or order number required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
