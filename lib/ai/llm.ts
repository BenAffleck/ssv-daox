export interface Llm {
  /** The model's text reply. Rejects with `LlmError` only. */
  complete(request: { prompt: string; maxTokens: number }): Promise<string>;
}

/** `critical`: auth or billing, so every further call fails too. */
export class LlmError extends Error {
  name = 'LlmError';

  constructor(
    readonly kind: 'critical' | 'failed',
    message: string,
  ) {
    super(message);
  }
}
