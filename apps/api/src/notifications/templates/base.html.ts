/**
 * Single-column 600px transactional shell — real text, no background images.
 */
export function wrapEmailHtml(opts: {
  title: string;
  bodyHtml: string;
  /** Per-category mute link (not full unsubscribe). */
  muteUrl?: string;
  muteLabel?: string;
}): string {
  const mute = opts.muteUrl
    ? `<p style="margin:16px 0 0;font-size:12px;color:#5A4B3F;"><a href="${escapeHtml(opts.muteUrl)}" style="color:#5A4B3F;">${escapeHtml(opts.muteLabel ?? 'Tắt loại thông báo này')}</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#F5F2EC;font-family:Georgia,'Times New Roman',serif;color:#2E2620;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F2EC;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#FDFBF7;border:1px solid #E5DFD3;">
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;color:#B04A3A;font-family:Arial,sans-serif;">THIỆP VIỆT</p>
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:normal;line-height:1.35;">${escapeHtml(opts.title)}</h1>
          <div style="font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
            ${opts.bodyHtml}
          </div>
        </td></tr>
        <tr><td style="padding:20px 40px 28px;border-top:1px solid #E5DFD3;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#5A4B3F;">
          <p style="margin:0;">Công ty TNHH Thiệp Việt · Hotline 1900 6868 (8:00–21:00)</p>
          ${mute}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;">${escapeHtml(text)}</p>`;
}

export function ctaRow(
  primary: { label: string; href: string },
  secondary?: { label: string; href: string }
): string {
  const sec = secondary
    ? ` &nbsp; <a href="${escapeHtml(secondary.href)}" style="color:#B04A3A;">${escapeHtml(secondary.label)}</a>`
    : '';
  return `<p style="margin:20px 0 0;"><a href="${escapeHtml(primary.href)}" style="display:inline-block;background:#B04A3A;color:#FDFBF7;text-decoration:none;padding:12px 20px;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(primary.label)}</a>${sec}</p>`;
}
