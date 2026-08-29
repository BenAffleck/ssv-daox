'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CornerDownLeft, ExternalLink, Info, Sparkles } from 'lucide-react';

import { AI_QNA_CONFIG } from '@/lib/ai-qna/config';
import type { ProposalAnswer } from '@/lib/ai-qna/types';

/** The proposal fields the dialog needs — kept minimal so both full proposals
 *  and slim search-index entries can drive it. */
export interface AskDialogProposal {
  id: string;
  title: string;
  link: string;
}

interface AskProposalDialogProps {
  proposal: AskDialogProposal;
  open: boolean;
  onClose: () => void;
}

/**
 * Single-question Q&A against one proposal.
 *
 * One question in, one answer out: asking again replaces the previous answer
 * rather than building a thread. Answers are grounded in the proposal's text
 * only, so the model is expected to decline questions about live results.
 */
export default function AskProposalDialog({ proposal, open, onClose }: AskProposalDialogProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<ProposalAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Reset per-proposal state on open and restore focus to the trigger on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setQuestion('');
    setAnswer(null);
    setError(null);
    setIsLoading(false);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open, proposal.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const ask = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    // Clear the previous answer so a stale one never sits under a new question.
    setAnswer(null);

    try {
      const response = await fetch('/api/proposal-qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id, question: trimmed }),
      });

      const data = await response.json();

      if (data.answer) {
        setAnswer(data.answer);
      } else {
        setError(data.error || 'Failed to answer the question');
      }
    } catch {
      setError('Failed to reach the Q&A service');
    } finally {
      setIsLoading(false);
    }
  }, [question, isLoading, proposal.id]);

  const onInputKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const remaining = AI_QNA_CONFIG.maxQuestionLength - question.length;
  const showCounter = remaining <= 100;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/45 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      data-testid="ask-dialog-scrim"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ask about ${proposal.title}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-lg border border-border bg-card"
        style={{
          boxShadow: '0 24px 60px -12px rgba(0,0,0,.35), var(--shadow-glow-lg)',
          animation: 'palette-in .14s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border px-4 py-3.5">
          <Sparkles size={18} className="mt-0.5 flex-shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="font-heading text-[10px] font-semibold tracking-wider text-muted uppercase">
              Ask about
            </div>
            <div className="truncate font-heading text-[14px] font-semibold text-foreground">
              {proposal.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-heading text-[11px] font-semibold text-muted transition-colors hover:text-foreground"
          >
            Esc
          </button>
        </div>

        {/* Question input */}
        <div className="border-b border-border px-4 py-3">
          <textarea
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, AI_QNA_CONFIG.maxQuestionLength))}
            onKeyDown={onInputKey}
            rows={2}
            placeholder="What would you like to know about this proposal?"
            aria-label="Your question"
            className="w-full resize-none border-none bg-transparent font-body text-[14px] text-foreground placeholder:text-muted/70 focus:outline-none"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted">
              {showCounter
                ? `${remaining} characters left`
                : 'Answers come from this proposal’s text only.'}
            </span>
            <button
              type="button"
              onClick={ask}
              disabled={isLoading || question.trim().length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-glow transition-colors hover:bg-primary/80 disabled:opacity-50"
            >
              {answer || error ? 'Ask again' : 'Ask'}
              <CornerDownLeft size={13} />
            </button>
          </div>
        </div>

        {/* Answer area */}
        <div className="flex-1 overflow-auto px-4 py-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-[13px] text-secondary">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
              Reading the proposal…
            </div>
          )}

          {!isLoading && error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}

          {!isLoading && !error && answer && (
            <div className="space-y-3">
              {!answer.answered && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    This isn’t covered by the proposal text. Check the proposal page for live
                    results and discussion.
                  </span>
                </div>
              )}

              <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-foreground">
                {answer.answer}
              </p>

              {answer.supportingQuotes.length > 0 && (
                <div className="space-y-1.5 rounded-lg border border-border bg-background px-3 py-2.5">
                  <div className="font-heading text-[10px] font-semibold tracking-wider text-muted uppercase">
                    From the proposal
                  </div>
                  {answer.supportingQuotes.map((quote, i) => (
                    <p
                      key={i}
                      className="border-l-2 border-secondary/40 pl-2.5 text-[12px] leading-relaxed text-muted italic"
                    >
                      {quote}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && !answer && (
            <p className="text-[13px] text-muted">
              Ask a single question — for example, what changes if this passes, who is responsible
              for executing it, or what each voting choice means.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-border bg-card-hover px-4 py-2 text-[11px] text-muted">
          <span>AI-generated — verify against the proposal before voting.</span>
          <span className="flex-1" />
          <a
            href={proposal.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
          >
            View Proposal
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}
