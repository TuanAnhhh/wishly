/**
 * Map Guest.group → default honorific (role).
 * Wrong role in a wedding invite is a real social error — allow manual override via Guest.role.
 */
export function deriveGuestRole(group: string | null | undefined): string {
  const g = (group ?? '').toLowerCase();
  if (
    g.includes('họ hàng') ||
    g.includes('ho hang') ||
    g.includes('nhà gái') ||
    g.includes('nha gai') ||
    g.includes('nhà trai') ||
    g.includes('nha trai')
  ) {
    return 'cô/chú';
  }
  if (
    g.includes('bạn') ||
    g.includes('ban ') ||
    g.includes('bạn bè') ||
    g.includes('bạn cô dâu') ||
    g.includes('bạn chú rể')
  ) {
    return 'bạn';
  }
  if (g.includes('đồng nghiệp') || g.includes('dong nghiep')) {
    return 'anh/chị';
  }
  return 'anh/chị';
}
