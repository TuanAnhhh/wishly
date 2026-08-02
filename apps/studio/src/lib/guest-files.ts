/** Lazy sheetjs helpers for guest Excel + gift CSV. */

export type GuestRow = {
  name: string;
  phone: string;
  group: string;
  note?: string;
  rsvp?: string;
  plusOnes?: number;
};

export type GiftRow = {
  giverName: string;
  amount: number;
  side: string;
  note?: string | null;
};

function normalizeHeader(h: unknown): string {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function parseAmount(raw: unknown): number | null {
  const s = String(raw ?? '').replace(/[^\d]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function exportGuestsXlsx(rows: GuestRow[], filename: string) {
  const XLSX = await import('xlsx');
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Tên: r.name,
      Nhóm: r.group,
      SĐT: r.phone,
      'Ghi chú': r.note ?? '',
      'Phản hồi': r.rsvp ?? '',
      'Đi cùng': r.plusOnes ?? '',
    }))
  );
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Khách mời');
  XLSX.writeFile(book, filename);
}

/** Owner-only meal/allergy sheet for restaurant (CORPORATE). */
export async function exportMealsXlsx(
  rows: Array<{
    name: string;
    mealChoice: string;
    allergyNote: string;
    tableLabel: string;
    partySize: number;
  }>,
  filename: string,
  summary: { standard: number; vegetarian: number; allergyCount: number }
) {
  const XLSX = await import('xlsx');
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet([
      {
        'Suất thường': summary.standard,
        'Suất chay': summary.vegetarian,
        'Có dị ứng': summary.allergyCount,
      },
    ]),
    'Tổng'
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        Tên: r.name,
        'Suất ăn': r.mealChoice,
        'Dị ứng': r.allergyNote,
        Bàn: r.tableLabel,
        'Số người': r.partySize,
      }))
    ),
    'Chi tiết'
  );
  XLSX.writeFile(book, filename);
}

export async function parseGuestsFromFile(file: File): Promise<GuestRow[]> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const book = XLSX.read(buf, { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0]!];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });
  if (!raw.length) return [];

  const keys = Object.keys(raw[0] ?? {}).map((k) => ({
    key: k,
    n: normalizeHeader(k),
  }));
  const nameKey =
    keys.find((k) => k.n === 'ten' || k.n === 'name' || k.n.includes('ho ten'))
      ?.key ?? keys[0]?.key;
  const phoneKey = keys.find(
    (k) =>
      k.n.includes('sdt') ||
      k.n.includes('dien thoai') ||
      k.n === 'phone' ||
      k.n === 'tel'
  )?.key;
  const groupKey = keys.find(
    (k) => k.n.includes('nhom') || k.n === 'group' || k.n.includes('ben')
  )?.key;

  return raw
    .map((row) => ({
      name: String(nameKey ? row[nameKey] ?? '' : '').trim(),
      phone: String(phoneKey ? row[phoneKey] ?? '' : '').trim(),
      group: String(groupKey ? row[groupKey] ?? '' : '').trim(),
    }))
    .filter((r) => r.name.length > 0);
}

/** Parse gift ledger or bank statement CSV/XLSX into gift rows. */
export async function parseGiftsFromFile(
  file: File,
  defaultSide = 'Chưa phân'
): Promise<GiftRow[]> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const book = XLSX.read(buf, { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0]!];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });
  if (!raw.length) return [];

  const keys = Object.keys(raw[0] ?? {}).map((k) => ({
    key: k,
    n: normalizeHeader(k),
  }));

  const nameKey = keys.find(
    (k) =>
      k.n.includes('ten') ||
      k.n.includes('nguoi') ||
      k.n === 'name' ||
      k.n.includes('giver')
  )?.key;
  const amountKey = keys.find(
    (k) =>
      k.n.includes('so tien') ||
      k.n.includes('amount') ||
      k.n === 'tien' ||
      k.n.includes('credit') ||
      k.n.includes('ghi co') ||
      k.n.includes('phat sinh')
  )?.key;
  const sideKey = keys.find(
    (k) => k.n.includes('nha') || k.n === 'side' || k.n.includes('ben')
  )?.key;
  const noteKey = keys.find(
    (k) =>
      k.n.includes('noi dung') ||
      k.n.includes('dien giai') ||
      k.n.includes('mo ta') ||
      k.n.includes('note') ||
      k.n.includes('ghi chu')
  )?.key;

  const rows: GiftRow[] = [];
  for (const row of raw) {
    const amount = parseAmount(amountKey ? row[amountKey] : undefined);
    if (!amount) continue;
    const note = String(noteKey ? row[noteKey] ?? '' : '').trim();
    const name = String(nameKey ? row[nameKey] ?? '' : '').trim() || note || 'Khách';
    const side =
      String(sideKey ? row[sideKey] ?? '' : '').trim() || defaultSide;
    rows.push({
      giverName: name.slice(0, 120),
      amount,
      side: side.slice(0, 40),
      note: note && note !== name ? note.slice(0, 500) : null,
    });
  }
  return rows;
}

export function guestsToImportText(rows: GuestRow[]): string {
  return rows
    .map((r) => [r.name, r.phone, r.group].filter(Boolean).join(', '))
    .join('\n');
}
