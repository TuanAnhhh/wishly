import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  InvitationRenderer,
  VERIFY_CONTENT,
  VERIFY_ENTRY_PASS,
  getTemplate,
} from '@wishly/templates';

/**
 * Headless render target for tools/verify/ (Playwright).
 * No app chrome — the script measures overflow/contrast on document.documentElement.
 * `data-verify-status="ready"` gates the script's waitForSelector; document.fonts.ready
 * is awaited separately by the script itself, not signalled here.
 *
 * Query params — all resolved through existing whitelist/fallback functions,
 * never rendered from raw input directly (see phase-05 Security Considerations):
 *   ?slug=       required, resolved via `getTemplate` (undefined -> error state below)
 *   ?styleId=    optional override for `theme.styleId`; unknown id falls back
 *                to `classic` inside `resolveTheme`/`getStyle` — never throws
 *   ?fontId=     optional override for `theme.fontId`; unknown id falls back
 *                to `be-cormorant` inside `resolveTheme`/`getFont` — never throws
 *   ?variant=    optional override for the `cover` block's `variant`; unknown
 *                id falls back to `photo-full` inside `Cover.tsx` — never throws
 *   ?eventType=  optional sanity check only (does not change render) — flags
 *                a mismatch so `tools/verify/matrix.ts` bugs (picking the
 *                wrong representative template for a style/variant case)
 *                surface as a visible error instead of a silent wrong shot
 */
export function TemplateVerifyPage() {
  const [params] = useSearchParams();
  const slug = params.get('slug') ?? '';
  const styleIdOverride = params.get('styleId');
  const fontIdOverride = params.get('fontId');
  const variantOverride = params.get('variant');
  const eventTypeExpected = params.get('eventType');
  const template = getTemplate(slug);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(Boolean(template));
  }, [template]);

  if (!template) {
    return <div>Template không tồn tại: {slug || '(thiếu ?slug=)'}</div>;
  }

  if (eventTypeExpected && template.meta.eventType !== eventTypeExpected) {
    return (
      <div>
        eventType mismatch cho slug=&quot;{slug}&quot;: mong{' '}
        {eventTypeExpected}, thực tế {template.meta.eventType}
      </div>
    );
  }

  const theme =
    styleIdOverride || fontIdOverride
      ? {
          ...template.theme,
          ...(styleIdOverride ? { styleId: styleIdOverride } : {}),
          ...(fontIdOverride ? { fontId: fontIdOverride } : {}),
        }
      : template.theme;

  const blocks = variantOverride
    ? template.blocks.map((b) =>
        b.key === 'cover' ? { ...b, variant: variantOverride } : b
      )
    : template.blocks;

  return (
    <div data-verify-status={ready ? 'ready' : undefined}>
      <InvitationRenderer
        content={VERIFY_CONTENT}
        theme={theme}
        blocks={blocks}
        tier={template.meta.tier}
        interactions={{ entryPass: VERIFY_ENTRY_PASS }}
      />
    </div>
  );
}
