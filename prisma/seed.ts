import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });
  console.log('Admin user created');

  // Create categories and items
  const hotCoffee = await prisma.category.upsert({
    where: { id: 'hot-coffee' },
    update: {},
    create: {
      id: 'hot-coffee',
      name: 'Hot Coffee',
      sortOrder: 1,
    },
  });

  const coldCoffee = await prisma.category.upsert({
    where: { id: 'cold-coffee' },
    update: {},
    create: {
      id: 'cold-coffee',
      name: 'Cold Coffee',
      sortOrder: 2,
    },
  });

  const specials = await prisma.category.upsert({
    where: { id: 'specials' },
    update: {},
    create: {
      id: 'specials',
      name: 'Specials',
      sortOrder: 3,
    },
  });

  // Hot Coffee items
  const hotCoffeeItems = [
    { name: 'Espresso', description: 'Strong and bold single shot', price: 99, sortOrder: 1 },
    { name: 'Americano', description: 'Espresso with hot water', price: 129, sortOrder: 2 },
    { name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 149, sortOrder: 3 },
    { name: 'Latte', description: 'Espresso with steamed milk', price: 159, sortOrder: 4 },
    { name: 'Mocha', description: 'Espresso with chocolate and milk', price: 179, sortOrder: 5 },
    { name: 'Macchiato', description: 'Espresso with a dash of milk', price: 139, sortOrder: 6 },
  ];

  for (const item of hotCoffeeItems) {
    await prisma.menuItem.upsert({
      where: { id: `hot-${item.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `hot-${item.name.toLowerCase().replace(/\s/g, '-')}`,
        categoryId: hotCoffee.id,
        ...item,
      },
    });
  }

  // Cold Coffee items
  const coldCoffeeItems = [
    { name: 'Iced Americano', description: 'Chilled espresso with cold water', price: 149, sortOrder: 1 },
    { name: 'Iced Latte', description: 'Espresso with cold milk over ice', price: 169, sortOrder: 2 },
    { name: 'Cold Brew', description: 'Slow-steeped for 20 hours', price: 179, sortOrder: 3 },
    { name: 'Frappuccino', description: 'Blended iced coffee drink', price: 199, sortOrder: 4 },
    { name: 'Iced Mocha', description: 'Chocolate espresso over ice', price: 189, sortOrder: 5 },
  ];

  for (const item of coldCoffeeItems) {
    await prisma.menuItem.upsert({
      where: { id: `cold-${item.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `cold-${item.name.toLowerCase().replace(/\s/g, '-')}`,
        categoryId: coldCoffee.id,
        ...item,
      },
    });
  }

  // Specials
  const specialItems = [
    { name: 'Caramel Macchiato', description: 'Vanilla, espresso, caramel drizzle', price: 219, sortOrder: 1 },
    { name: 'Hazelnut Latte', description: 'Rich hazelnut flavored latte', price: 209, sortOrder: 2 },
    { name: 'Vanilla Bean Frappuccino', description: 'Creamy vanilla blended drink', price: 229, sortOrder: 3 },
  ];

  for (const item of specialItems) {
    await prisma.menuItem.upsert({
      where: { id: `special-${item.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `special-${item.name.toLowerCase().replace(/\s/g, '-')}`,
        categoryId: specials.id,
        ...item,
      },
    });
  }

  console.log('Menu items created');

  // Create pickup locations
  const locations = [
    { name: 'Main Counter', address: 'Ground Floor', sortOrder: 1 },
    { name: 'Drive Through', address: 'Parking Area', sortOrder: 2 },
    { name: 'Express Counter', address: 'Near Exit', sortOrder: 3 },
  ];

  for (const loc of locations) {
    await prisma.pickupLocation.upsert({
      where: { id: loc.name.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: {
        id: loc.name.toLowerCase().replace(/\s/g, '-'),
        ...loc,
      },
    });
  }
  console.log('Pickup locations created');

  // Create time slot config
  await prisma.timeSlotConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      startTime: '09:00',
      endTime: '22:00',
      slotDuration: 15,
      maxOrdersPerSlot: 5,
    },
  });
  console.log('Time slot config created');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
