'use client';

import { openStep, type StepAnchor } from './StepPanel';

export default function OpenStepButton({
  anchor,
  children,
}: {
  anchor: StepAnchor;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => openStep(anchor)}
      className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
    >
      {children}
    </button>
  );
}
