/**
 * Upsert Template rows from TEMPLATE_REGISTRY.
 * Usage: pnpm sync:templates
 */
import { PrismaClient } from '@prisma/client';
import { TEMPLATE_REGISTRY } from '../libs/templates/src/registry.ts';

const prisma = new PrismaClient();

async function main() {
  for (const tpl of TEMPLATE_REGISTRY) {
    await prisma.template.upsert({
      where: { id: tpl.meta.id },
      create: {
        id: tpl.meta.id,
        slug: tpl.meta.slug,
        name: tpl.meta.name,
        tier: tpl.meta.tier,
        thumbKey: tpl.meta.thumbKey,
        blocks: tpl.blocks,
        active: true,
        sortOrder: tpl.meta.sortOrder,
      },
      update: {
        slug: tpl.meta.slug,
        name: tpl.meta.name,
        tier: tpl.meta.tier,
        thumbKey: tpl.meta.thumbKey,
        blocks: tpl.blocks,
        active: true,
        sortOrder: tpl.meta.sortOrder,
      },
    });
  }
  console.log(`Synced ${TEMPLATE_REGISTRY.length} templates from registry`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
