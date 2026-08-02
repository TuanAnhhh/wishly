/** Common NAPAS BIN codes for VietQR image URLs */
export const BANK_BINS: Record<string, string> = {
  vietcombank: '970436',
  vcb: '970436',
  techcombank: '970407',
  tcb: '970407',
  mbbank: '970422',
  mb: '970422',
  vietinbank: '970415',
  ctg: '970415',
  bidv: '970418',
  agribank: '970405',
  acb: '970416',
  tpbank: '970423',
  vpbank: '970432',
  sacombank: '970403',
  shb: '970443',
  ocb: '970448',
  msb: '970426',
  vietbank: '970433',
  seabank: '970440',
  hdbank: '970437',
  eximbank: '970431',
  namabank: '970428',
  pvcombank: '970412',
  baoViet: '970438',
  baoviet: '970438',
};

export function resolveBankBin(bankLabel: string): string | null {
  const key = bankLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '');
  for (const [name, bin] of Object.entries(BANK_BINS)) {
    if (key.includes(name.replace(/bank$/, '')) || key.includes(name)) {
      return bin;
    }
  }
  // Allow raw 6-digit BIN
  if (/^\d{6}$/.test(bankLabel.trim())) return bankLabel.trim();
  return null;
}

/** Public VietQR image (no money flows through our servers). */
export function vietQrImageUrl(input: {
  bank: string;
  accountNo: string;
  accountName: string;
  amount?: number;
  addInfo?: string;
}): string | null {
  const bin = resolveBankBin(input.bank);
  const accountNo = input.accountNo.replace(/\s+/g, '');
  if (!bin || !accountNo) return null;
  const params = new URLSearchParams();
  if (input.accountName) params.set('accountName', input.accountName);
  if (input.amount && input.amount > 0) params.set('amount', String(input.amount));
  if (input.addInfo) params.set('addInfo', input.addInfo);
  const q = params.toString();
  return `https://img.vietqr.io/image/${bin}-${accountNo}-compact2.png${q ? `?${q}` : ''}`;
}
