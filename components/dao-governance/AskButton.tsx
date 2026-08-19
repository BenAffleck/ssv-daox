'use client';

import { useState } from 'react';
import { MessageCircleQuestion } from 'lucide-react';
import AskProposalDialog, { type AskDialogProposal } from './AskProposalDialog';

interface AskButtonProps {
  proposal: AskDialogProposal;
}

/**
 * "Ask" pill plus the dialog it owns.
 *
 * Bundled together so the three vote cards each render one element — the TL;DR
 * block is already triplicated across those cards and this must not repeat it.
 */
export default function AskButton({ proposal }: AskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Ask a question about this proposal"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-glow transition-colors hover:bg-card-hover"
      >
        <MessageCircleQuestion size={13} />
        Ask
      </button>
      <AskProposalDialog
        proposal={proposal}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
