import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, partnerApi, queryKeys } from '@wishly/api-client';
import {
  BaseButton,
  BaseTextField,
  Input,
  Label,
  LoadingSkeleton,
} from '@wishly/ui';

const SUGGESTED = [
  '#1F4E5F',
  '#8B3A3A',
  '#2F5D50',
  '#5C4B3A',
  '#3D4F7C',
  '#6B4E71',
];

export function PartnerBrandPage() {
  const qc = useQueryClient();
  const brand = useQuery({
    queryKey: queryKeys.partner.brand(),
    queryFn: () => partnerApi.getBrand(),
  });
  const [color, setColor] = useState('#1F4E5F');
  const [signature, setSignature] = useState('');
  const [subdomain, setSubdomain] = useState('');

  useEffect(() => {
    if (!brand.data) return;
    setColor(brand.data.color ?? '#1F4E5F');
    setSignature(brand.data.signature ?? '');
    setSubdomain(brand.data.subdomain ?? '');
  }, [brand.data]);

  const save = useMutation({
    mutationFn: () =>
      partnerApi.updateBrand({
        color,
        signature: signature || null,
        subdomain: subdomain || null,
      }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.partner.brand() }),
  });

  if (brand.isLoading) return <LoadingSkeleton variant="guest-list" rows={4} />;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl">Thương hiệu</h1>
        <p className="text-sm text-secondary-foreground">
          Áp lên thiệp đã publish khi gói đang active — đổi màu thấy ngay trên SPA.
        </p>
      </header>

      <div className="space-y-2">
        <Label>Màu nhấn</Label>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((c) => (
            <button
              key={c}
              type="button"
              className="h-8 w-8 rounded-full border border-border"
              style={{ background: c }}
              aria-label={c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <Input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="#1F4E5F"
        />
      </div>

      <BaseTextField
        id="sig"
        label="Chữ ký chân trang"
        hint="Thay watermark “Tạo bằng Thiệp Việt” trên thiệp FREE của khách."
        value={signature}
        onChange={(e) => setSignature(e.target.value)}
        placeholder="Thiết kế bởi Studio Hoa Sen"
        maxLength={80}
      />

      <BaseTextField
        id="sub"
        label="Subdomain"
        hint={`Trạng thái DNS: ${brand.data?.domainStatus ?? 'none'}. Domain riêng (abc.vn) tạm hoãn — cần ACME từng domain.`}
        endAddon={<span className="whitespace-nowrap">.thiepviet.vn</span>}
        value={subdomain}
        onChange={(e) =>
          setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
        }
        placeholder="hoa-sen"
      />

      <div
        className="rounded-md border border-border p-6 text-center"
        style={{ borderColor: color }}
      >
        <p className="font-serif text-xl" style={{ color }}>
          Xem trước chữ ký
        </p>
        <p className="mt-4 text-xs text-secondary-foreground">
          {signature || 'Thiết kế bởi Studio của bạn'}
        </p>
      </div>

      {save.error ? (
        <p className="text-sm text-destructive">
          {save.error instanceof ApiError
            ? save.error.message
            : 'Không lưu được'}
        </p>
      ) : null}

      <BaseButton
        type="button"
        loading={save.isPending}
        onClick={() => save.mutate()}
      >
        Lưu thương hiệu
      </BaseButton>
    </div>
  );
}
