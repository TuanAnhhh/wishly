import type { FieldDef } from '@wishly/contracts';
import { BaseTextAreaField, BaseTextField, Button } from '@wishly/ui';
import { MediaField } from './MediaField';

const MAX_BY_NAME: Record<string, number> = {
  items: 20,
  schedule: 8,
  accounts: 4,
};

type Props = {
  field: FieldDef;
  value: unknown;
  onChange: (next: Record<string, unknown>[]) => void;
};

function emptyItem(itemFields: FieldDef[]): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const f of itemFields) {
    if (f.type === 'media') row[f.name] = null;
    else if (f.type === 'boolean') row[f.name] = false;
    else if (f.type === 'number') row[f.name] = 0;
    else if (f.type === 'bilingual-text' || f.type === 'bilingual-textarea')
      row[f.name] = { vi: '', en: '' };
    else row[f.name] = '';
  }
  return row;
}

function ItemFieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const id = `array-item-${field.name}`;
  if (field.type === 'textarea') {
    return (
      <BaseTextAreaField
        id={id}
        label={field.label}
        value={typeof value === 'string' ? value : ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.type === 'media') {
    return (
      <MediaField field={field} value={value} onChange={(key) => onChange(key)} />
    );
  }
  if (field.type === 'bilingual-text' || field.type === 'bilingual-textarea') {
    const bi =
      value && typeof value === 'object'
        ? (value as { vi?: string; en?: string })
        : { vi: typeof value === 'string' ? value : '', en: '' };
    const AreaField =
      field.type === 'bilingual-textarea' ? BaseTextAreaField : BaseTextField;
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <AreaField
          id={`${id}-vi`}
          label={`${field.label} (VI)`}
          value={bi.vi ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange({ ...bi, vi: e.target.value })}
        />
        <AreaField
          id={`${id}-en`}
          label={`${field.label} (EN)`}
          value={bi.en ?? ''}
          placeholder="English"
          onChange={(e) => onChange({ ...bi, en: e.target.value })}
        />
      </div>
    );
  }
  return (
    <BaseTextField
      id={id}
      label={field.label}
      type={field.type === 'url' ? 'url' : 'text'}
      value={
        typeof value === 'string' ? value : value == null ? '' : String(value)
      }
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ArrayField({ field, value, onChange }: Props) {
  const itemFields = field.itemFields ?? [];
  const max = MAX_BY_NAME[field.name] ?? 8;
  const items = Array.isArray(value)
    ? (value as Record<string, unknown>[])
    : [];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{field.label}</p>
        {field.help ? (
          <p className="text-sm text-secondary-foreground">{field.help}</p>
        ) : null}
        <p className="text-sm text-secondary-foreground">
          {items.length}/{max} mục
        </p>
      </div>
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li
            key={`${field.name}-${index}`}
            className="space-y-3 border border-border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Mục {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                Xóa
              </Button>
            </div>
            {itemFields.map((itemField) => (
              <ItemFieldControl
                key={itemField.name}
                field={itemField}
                value={item[itemField.name]}
                onChange={(v) => {
                  const next = items.map((row, i) =>
                    i === index ? { ...row, [itemField.name]: v } : row
                  );
                  onChange(next);
                }}
              />
            ))}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={items.length >= max || itemFields.length === 0}
        onClick={() => onChange([...items, emptyItem(itemFields)])}
      >
        Thêm mục
      </Button>
    </div>
  );
}
