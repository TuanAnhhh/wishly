export type RingStatTone = 'neutral' | 'success' | 'warning' | 'muted';

const TONE_STROKE: Record<RingStatTone, string> = {
  neutral: 'stroke-primary',
  success: 'stroke-success',
  warning: 'stroke-warning',
  muted: 'stroke-muted-foreground',
};

export type RingStatProps = {
  /** 0-100 */
  percent: number;
  value: number | string;
  label: string;
  tone?: RingStatTone;
};

const RADIUS = 15.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Radial percentage gauge + big number + label, used for guest RSVP summary cards. */
export function RingStat({ percent, value, label, tone = 'neutral' }: RingStatProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-11 shrink-0">
        <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
          <circle
            cx={18}
            cy={18}
            r={RADIUS}
            fill="none"
            strokeWidth={3}
            className="stroke-border"
          />
          <circle
            cx={18}
            cy={18}
            r={RADIUS}
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={TONE_STROKE[tone]}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tabular-nums text-secondary-foreground">
          {Math.round(clamped)}%
        </span>
      </div>
      <div>
        <p className="font-serif text-2xl leading-none tabular-nums">{value}</p>
        <p className="text-xs text-secondary-foreground">{label}</p>
      </div>
    </div>
  );
}

export default RingStat;
