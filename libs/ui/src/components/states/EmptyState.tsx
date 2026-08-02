import type { ReactNode } from 'react';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/button.js';

export type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
};

export type EmptyStateProps = {
  /** Optional line-art illustration — omit if no asset (do not use Heroicons as stand-in). */
  illustration?: ReactNode;
  title: string;
  body: string;
  /** Exactly one primary action — enforced by type (not an actions array). */
  primary: EmptyStateAction;
  secondary?: EmptyStateAction;
  hint?: string;
  className?: string;
};

function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: 'default' | 'outline';
}) {
  if (action.href) {
    return (
      <Button asChild variant={variant}>
        <a href={action.href}>{action.label}</a>
      </Button>
    );
  }
  return (
    <Button type="button" variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  illustration,
  title,
  body,
  primary,
  secondary,
  hint,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        'flex flex-col items-center px-4 py-12 text-center',
        className
      )}
      data-slot="empty-state"
    >
      {illustration ? (
        <div className="mb-6 text-border-strong" aria-hidden>
          {illustration}
        </div>
      ) : null}
      <h2 className="font-serif text-2xl leading-[1.3] text-foreground">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-sm text-secondary-foreground">{body}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <ActionButton action={primary} variant="default" />
        {secondary ? (
          <ActionButton action={secondary} variant="outline" />
        ) : null}
      </div>
      {hint ? (
        <p className="mt-4 max-w-sm text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </section>
  );
}
