import { useSearchParams } from 'react-router-dom';
import { readStep, STEP_LABELS } from '../../app/upgrade/step';

/** Step indicator for /upgrade. Reads the step from the URL, not page state. */
export function UpgradeSteps() {
  const [search] = useSearchParams();
  const step = readStep(search);

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
      {STEP_LABELS.map((s) => (
        <span
          key={s.id}
          className={
            s.id === step
              ? 'rounded-full bg-primary px-2.5 py-1 font-medium text-primary-foreground'
              : 'px-2 py-1 text-muted-foreground'
          }
          aria-current={s.id === step ? 'step' : undefined}
        >
          {s.label}
        </span>
      ))}
    </nav>
  );
}

export default UpgradeSteps;
