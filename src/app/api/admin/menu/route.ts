import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'category') {
      const { name, sortOrder } = body;
      const category = await prisma.category.create({
        data: { name, sortOrder: sortOrder || 0 },
      });
      return NextResponse.json({ category });
    }

    if (type === 'item') {
      const { name, description, price, image, categoryId, sortOrder } = body;
      const item = await prisma.menuItem.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          image,
          categoryId,
          sortOrder: sortOrder || 0,
        },
      });
      return NextResponse.json({ item });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
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
    const { type, id, ...data } = body;

    if (type === 'category') {
      const category = await prisma.category.update({
        where: { id },
        data,
      });
      return NextResponse.json({ category });
    }

    if (type === 'item') {
      if (data.price) {
        data.price = parseFloat(data.price);
      }
      const item = await prisma.menuItem.update({
        where: { id },
        data,
      });
      return NextResponse.json({ item });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID required' },
        { status: 400 }
      );
    }

    if (type === 'category') {
      await prisma.category.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (type === 'item') {
      await prisma.menuItem.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
