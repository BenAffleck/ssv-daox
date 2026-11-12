import { describe, expect, it } from 'vitest';

import { markdownToSnippet } from '../markdown';

describe('markdownToSnippet', () => {
  it('strips markdown formatting into a single line', () => {
    const snippet = markdownToSnippet(
      '# Heading\n\n- A **bold** point\n- Another `code` point',
      180,
    );
    expect(snippet).toBe('Heading A bold point Another code point');
  });

  it('keeps link text and drops the target', () => {
    expect(markdownToSnippet('See [the forum post](https://forum.example/x) for detail', 180)).toBe(
      'See the forum post for detail',
    );
  });

  it('removes fenced code blocks and images', () => {
    expect(markdownToSnippet('Before ```const x = 1;``` ![alt](img.png) after', 180)).toBe(
      'Before after',
    );
  });

  it('truncates to the requested length with an ellipsis', () => {
    const snippet = markdownToSnippet('word '.repeat(100), 20);
    expect(snippet.length).toBeLessThanOrEqual(21);
    expect(snippet.endsWith('…')).toBe(true);
  });
});
