import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample halls
  const hall1 = await prisma.hall.create({
    data: {
      name: 'Grand Ballroom',
      description: 'Elegant ballroom perfect for weddings and corporate events',
      capacity: 300,
      area: 2500,
      location: 'Ground Floor',
      amenities: ['Air Conditioning', 'Sound System', 'Lighting', 'Stage', 'Parking'],
      baseRate: 50000,
      hourlyRate: 5000,
      dailyRate: 40000,
      weekendRate: 60000,
      isActive: true,
      isAvailable: true,
      images: ['hall1-1.jpg', 'hall1-2.jpg'],
      floorPlan: 'grand-ballroom-plan.pdf',
    },
  });

  const hall2 = await prisma.hall.create({
    data: {
      name: 'Conference Hall A',
      description: 'Professional conference hall for business meetings and seminars',
      capacity: 100,
      area: 800,
      location: 'First Floor',
      amenities: ['Air Conditioning', 'Projector', 'Whiteboard', 'WiFi', 'Parking'],
      baseRate: 15000,
      hourlyRate: 2000,
      dailyRate: 12000,
      weekendRate: 18000,
      isActive: true,
      isAvailable: true,
      images: ['hall2-1.jpg', 'hall2-2.jpg'],
      floorPlan: 'conference-hall-a-plan.pdf',
    },
  });

  const hall3 = await prisma.hall.create({
    data: {
      name: 'Garden Pavilion',
      description: 'Outdoor pavilion surrounded by beautiful gardens',
      capacity: 200,
      area: 1500,
      location: 'Garden Area',
      amenities: ['Garden View', 'Natural Lighting', 'Sound System', 'Parking'],
      baseRate: 30000,
      hourlyRate: 3000,
      dailyRate: 25000,
      weekendRate: 35000,
      isActive: true,
      isAvailable: true,
      images: ['hall3-1.jpg', 'hall3-2.jpg'],
      floorPlan: 'garden-pavilion-plan.pdf',
    },
  });

  // Create sample line items
  const lineItems = [
    {
      hallId: hall1.id,
      itemType: 'CHAIRS',
      itemName: 'Premium Chairs',
      description: 'Comfortable premium chairs for guests',
      quantity: 300,
      unitPrice: 50,
      totalPrice: 15000,
    },
    {
      hallId: hall1.id,
      itemType: 'DECORATION',
      itemName: 'Wedding Decoration Package',
      description: 'Complete wedding decoration with flowers and lighting',
      quantity: 1,
      unitPrice: 25000,
      totalPrice: 25000,
    },
    {
      hallId: hall1.id,
      itemType: 'CATERING',
      itemName: 'Premium Catering',
      description: 'Multi-cuisine catering service',
      quantity: 300,
      unitPrice: 500,
      totalPrice: 150000,
    },
    {
      hallId: hall2.id,
      itemType: 'AV_EQUIPMENT',
      itemName: 'Professional AV Setup',
      description: 'High-quality audio-visual equipment for presentations',
      quantity: 1,
      unitPrice: 5000,
      totalPrice: 5000,
    },
    {
      hallId: hall3.id,
      itemType: 'LIGHTING',
      itemName: 'Garden Lighting',
      description: 'Decorative lighting for evening events',
      quantity: 1,
      unitPrice: 8000,
      totalPrice: 8000,
    },
  ];

  for (const item of lineItems) {
    await prisma.hallLineItem.create({
      data: item,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Created ${3} halls and ${lineItems.length} line items`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
