import type { BlockKey, FieldDef } from '@wishly/contracts';
import { getBlockDef } from '@wishly/templates';
import {
  BaseDatePicker,
  BaseDatePickerTime,
  BaseTextAreaField,
  BaseTextField,
  Label,
} from '@wishly/ui';
import { AlbumField } from './AlbumField';
import { ArrayField } from './ArrayField';
import { MediaField } from './MediaField';

type Props = {
  blockKey: BlockKey;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
};

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const id = `field-${field.name}`;
  if (field.type === 'textarea') {
    return (
      <BaseTextAreaField
        id={id}
        name={field.name}
        label={field.label}
        hint={field.help}
        placeholder={field.placeholder}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.type === 'boolean') {
    return (
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    );
  }
  if (field.type === 'media') {
    return (
      <MediaField
        field={field}
        value={value}
        onChange={(key) => onChange(key)}
      />
    );
  }
  if (field.type === 'array' && field.name === 'mediaKeys') {
    return (
      <AlbumField
        field={field}
        value={value}
        onChange={(keys) => onChange(keys)}
      />
    );
  }
  if (field.type === 'array') {
    return (
      <ArrayField
        field={field}
        value={value}
        onChange={(items) => onChange(items)}
      />
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
      <div className="space-y-3">
        <p className="text-sm font-medium">{field.label}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <AreaField
            id={`${id}-vi`}
            label="Tiếng Việt"
            placeholder={field.placeholder}
            value={bi.vi ?? ''}
            onChange={(e) => onChange({ ...bi, vi: e.target.value })}
          />
          <AreaField
            id={`${id}-en`}
            label="English (không bắt buộc)"
            placeholder="English"
            value={bi.en ?? ''}
            onChange={(e) => onChange({ ...bi, en: e.target.value })}
          />
        </div>
        {field.help ? (
          <p className="text-sm text-secondary-foreground">{field.help}</p>
        ) : null}
      </div>
    );
  }
  if (field.type === 'date') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        <BaseDatePicker
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          placeholder={field.placeholder ?? 'Chọn ngày'}
        />
        {field.help ? (
          <p className="text-sm text-secondary-foreground">{field.help}</p>
        ) : null}
      </div>
    );
  }
  if (field.type === 'datetime') {
    return (
      <div className="space-y-2">
        <Label htmlFor={`${id}-date`}>{field.label}</Label>
        <BaseDatePickerTime
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          datePlaceholder={field.placeholder ?? 'Chọn ngày'}
          description={field.help}
        />
      </div>
    );
  }
  const inputType =
    field.type === 'url'
      ? 'url'
      : field.type === 'time'
        ? 'time'
        : field.type === 'number'
          ? 'number'
          : 'text';
  return (
    <BaseTextField
      id={id}
      name={field.name}
      type={inputType}
      label={field.label}
      hint={field.help}
      placeholder={field.placeholder}
      value={
        typeof value === 'string' ? value : value == null ? '' : String(value)
      }
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function BlockForm({ blockKey, value, onChange }: Props) {
  const def = getBlockDef(blockKey);
  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-border pb-4">
        <h2 className="font-serif text-xl leading-[1.25]">{def.label}</h2>
        {def.help ? (
          <p className="text-sm text-secondary-foreground">{def.help}</p>
        ) : null}
      </div>
      <div className="space-y-5">
        {def.fields.map((field) => (
          <FieldControl
            key={field.name}
            field={field}
            value={value[field.name]}
            onChange={(v) => onChange({ ...value, [field.name]: v })}
          />
        ))}
      </div>
    </div>
  );
}
