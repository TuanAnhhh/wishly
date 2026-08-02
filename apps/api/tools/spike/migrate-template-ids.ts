/** Phase 03 one-time migration: remap `Invitation.templateId` from the old
 * 14-template ids to the new family×event composed ids. User-approved
 * mapping (2026-08-01) — see plans/260801-0658-template-design-families/
 * reports/phase03-*.md for the reasoning behind each row, especially
 * tpl_ao_dai and tpl_sai_gon (no direct palette twin in the new 6 families).
 *
 * Usage: npx tsx apps/api/tools/spike/migrate-template-ids.ts [--apply]
 * Without --apply: dry run, prints counts, no writes.
 */
import { PrismaClient } from '@prisma/client';

const MAPPING: Record<string, string> = {
  tpl_co_ngu: 'tpl_lua_wedding',
  'co-ngu': 'tpl_lua_wedding', // bare-slug data-quality anomaly, same target
  tpl_ao_dai: 'tpl_lua_wedding',
  tpl_sai_gon: 'tpl_dong_son_wedding',
  tpl_tra_chieu: 'tpl_gach_bong_wedding',
  tpl_son_mai: 'tpl_son_mai_wedding',
  tpl_vang_cat: 'tpl_dong_son_wedding',
  tpl_sen_ha: 'tpl_sen_truc_wedding',
  tpl_giay_trang: 'tpl_giay_do_wedding',
  tpl_sinh_nhat_tra: 'tpl_gach_bong_birthday',
  tpl_sinh_nhat_giay: 'tpl_giay_do_birthday',
  tpl_day_thang_cat: 'tpl_dong_son_baby_month',
  tpl_cong_ty_tat_nien: 'tpl_giay_do_corporate',
};

async function main() {
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();

  const before = await prisma.invitation.groupBy({ by: ['templateId'], _count: true });
  console.log('BEFORE:', JSON.stringify(before, null, 2));

  const unmapped = before.filter((r) => !(r.templateId in MAPPING));
  if (unmapped.length) {
    console.error('Unmapped templateId(s) found — aborting, mapping incomplete:', unmapped);
    process.exit(1);
  }

  let totalPlanned = 0;
  for (const [oldId, newId] of Object.entries(MAPPING)) {
    const count = before.find((r) => r.templateId === oldId)?._count ?? 0;
    if (count === 0) continue;
    totalPlanned += count;
    console.log(`${apply ? 'APPLYING' : 'DRY RUN'}: ${oldId} -> ${newId} (${count} rows)`);
    if (apply) {
      const result = await prisma.invitation.updateMany({
        where: { templateId: oldId },
        data: { templateId: newId },
      });
      if (result.count !== count) {
        console.error(`MISMATCH: expected ${count}, updated ${result.count} for ${oldId}`);
      }
    }
  }

  console.log(`Total rows ${apply ? 'updated' : 'to update'}: ${totalPlanned}`);

  if (apply) {
    const after = await prisma.invitation.groupBy({ by: ['templateId'], _count: true });
    console.log('AFTER:', JSON.stringify(after, null, 2));
  }

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
