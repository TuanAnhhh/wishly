export type Step = 'plans' | 'pay' | 'processing' | 'success' | 'fail';

export const STEP_LABELS: Array<{ id: Step; label: string }> = [
  { id: 'plans', label: '1 · Nâng cấp' },
  { id: 'pay', label: '2 · Thanh toán' },
  { id: 'processing', label: '3 · Đang xử lý' },
  { id: 'success', label: 'Thành công' },
  { id: 'fail', label: 'Thất bại' },
];

const STEPS = new Set<string>(STEP_LABELS.map((s) => s.id));

export function isStep(value: string | null): value is Step {
  return value != null && STEPS.has(value);
}

/**
 * The step lives in the URL so the header can render it without page state,
 * and so a reload or a payment redirect lands on the right step.
 */
export function readStep(search: URLSearchParams): Step {
  const requested = search.get('step');
  if (isStep(requested)) return requested;
  return search.get('order') ? 'processing' : 'plans';
}
