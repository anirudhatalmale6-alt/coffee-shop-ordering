import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile, otp, name } = body;

    // Validate inputs
    if (!mobile || !otp) {
      return NextResponse.json(
        { error: 'Mobile and OTP required' },
        { status: 400 }
      );
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { mobile },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify OTP
    if (customer.otpCode !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Check OTP expiry
    if (customer.otpExpiry && customer.otpExpiry < new Date()) {
      return NextResponse.json(
        { error: 'OTP expired' },
        { status: 400 }
      );
    }

    // Update customer (clear OTP, update name if provided)
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        otpCode: null,
        otpExpiry: null,
        name: name || customer.name,
      },
    });

    // Generate token
    const token = generateToken({
      id: updatedCustomer.id,
      mobile: updatedCustomer.mobile,
      name: updatedCustomer.name,
      type: 'customer',
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        mobile: updatedCustomer.mobile,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
