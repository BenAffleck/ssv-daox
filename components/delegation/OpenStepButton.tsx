'use client';

import { openStep, type StepAnchor } from './StepPanel';

const VARIANT_CLASS = {
  button:
    'rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover',
  link: 'text-primary hover:underline',
};

export default function OpenStepButton({
  anchor,
  variant = 'button',
  children,
}: {
  anchor: StepAnchor;
  variant?: keyof typeof VARIANT_CLASS;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={() => openStep(anchor)} className={VARIANT_CLASS[variant]}>
      {children}
    </button>
  );
}
