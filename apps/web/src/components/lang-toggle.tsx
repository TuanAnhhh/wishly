import type { CorpLang } from '@wishly/templates';

type Props = {
  lang: CorpLang;
  onChange: (lang: CorpLang) => void;
};

/** Sticky VI/EN toggle — corporate invitations only. */
export function LangToggle({ lang, onChange }: Props) {
  return (
    <div
      className="sticky top-0 z-30 flex justify-end gap-1 px-3 py-2"
      style={{ background: 'color-mix(in srgb, var(--inv-bg, #FDFBF7) 92%, transparent)' }}
    >
      {(['vi', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={lang === code}
          className="min-h-9 min-w-10 px-3 text-sm font-medium"
          style={{
            border: '1px solid var(--inv-border-strong, #D8CDBB)',
            background:
              lang === code ? 'var(--inv-accent, #1F4E5F)' : 'transparent',
            color: lang === code ? '#fff' : 'var(--inv-ink, #2E2620)',
            borderRadius: 3,
          }}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
