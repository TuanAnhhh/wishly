import { DESIGN_FAMILIES, TemplateThumb } from '@wishly/templates';

/**
 * Phase 07 (plans/260801-0658-template-design-families) §Implementation
 * steps #7 — render every family's thumb at real gallery display size to
 * confirm texture/motif/frameShape actually read at 300px, not just in
 * theory. Dev-only, same `import.meta.env.DEV`-gated pattern as
 * `template-verify-page.tsx`.
 */
export function TemplateThumbGalleryPage() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <h2>Portrait — gallery card (2:3)</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
            maxWidth: 1200,
          }}
        >
          {DESIGN_FAMILIES.map((family) => (
            <div key={family.id}>
              <TemplateThumb
                nameLeft="Minh Anh"
                nameRight="Quốc Huy"
                dateLine="15.11.2026"
                theme={family.theme}
                coverVariant={family.coverVariant}
              />
              <p style={{ fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                {family.name} · {family.coverVariant ?? 'photo-full'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Compact — picker row</h2>
        <div style={{ display: 'flex', gap: 12, maxWidth: 900, flexWrap: 'wrap' }}>
          {DESIGN_FAMILIES.map((family) => (
            <div key={family.id} style={{ width: 90 }}>
              <TemplateThumb
                nameLeft="Minh Anh"
                nameRight="Quốc Huy"
                dateLine="15.11.2026"
                theme={family.theme}
                coverVariant={family.coverVariant}
                variant="compact"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
