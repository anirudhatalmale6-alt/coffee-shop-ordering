import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOTP } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile } = body;

    // Validate mobile number (Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { mobile },
    });

    if (customer) {
      // Update OTP
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          otpCode: otp,
          otpExpiry,
        },
      });
    } else {
      // Create new customer record with OTP
      customer = await prisma.customer.create({
        data: {
          name: '',
          mobile,
          otpCode: otp,
          otpExpiry,
        },
      });
    }

    // In production, you would send OTP via SMS here
    // For demo, we'll just log it
    console.log(`OTP for ${mobile}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // Remove this in production - only for demo
      demoOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
