import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      id: 'free',
      name: 'Miễn phí',
      price: 0,
      priceByEvent: null as null,
      guestLimit: 30,
      features: { watermark: true, slugRandom: true },
      active: true,
      sortOrder: 0,
    },
    {
      id: 'basic',
      name: 'Cơ bản',
      price: 199000,
      priceByEvent: { BIRTHDAY: 99000, BABY_MONTH: 99000 },
      guestLimit: 150,
      features: { watermark: false, customSlug: true },
      active: true,
      sortOrder: 1,
    },
    {
      id: 'premium',
      name: 'Cao cấp',
      price: 499000,
      priceByEvent: { BIRTHDAY: 99000, BABY_MONTH: 99000 },
      guestLimit: null as null,
      features: {
        watermark: false,
        customSlug: true,
        prioritySupport: true,
      },
      active: true,
      sortOrder: 2,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        priceByEvent: plan.priceByEvent ?? undefined,
        guestLimit: plan.guestLimit,
        features: plan.features,
        active: plan.active,
        sortOrder: plan.sortOrder,
      },
      update: {
        name: plan.name,
        price: plan.price,
        priceByEvent: plan.priceByEvent ?? undefined,
        guestLimit: plan.guestLimit,
        features: plan.features,
        active: plan.active,
        sortOrder: plan.sortOrder,
      },
    });
  }

  await prisma.discount.upsert({
    where: { code: 'CUOI20' },
    create: {
      code: 'CUOI20',
      percent: 20,
      maxUses: 100,
      active: true,
    },
    update: {
      percent: 20,
      maxUses: 100,
      active: true,
    },
  });

  console.log('Seeded 3 plans + discount CUOI20');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
