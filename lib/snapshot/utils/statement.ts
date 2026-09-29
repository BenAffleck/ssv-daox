export type StatementSegment =
  { kind: 'text'; text: string } | { kind: 'link'; text: string; href: string };

// A Markdown link (one level of parentheses in the URL) or a bare http(s) URL.
const LINK = /\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)|(https?:\/\/[^\s<>()[\]]+)/g;
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function plain(text: string): string {
  return text
    .replace(/\\\n/g, '\n')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[^\w*])([*_])(?!\s)([^*_\n]+?)\2(?![\w*])/g, '$1$3');
}

/**
 * Splits a Snapshot delegate statement (Markdown) into plain text and links.
 * Only http(s) targets become links; emphasis markers are dropped.
 */
export function statementSegments(markdown: string): StatementSegment[] {
  const segments: StatementSegment[] = [];
  const pushText = (text: string) => {
    if (!text) {
      return;
    }
    const last = segments.at(-1);
    if (last?.kind === 'text') {
      last.text += text;
    } else {
      segments.push({ kind: 'text', text });
    }
  };

  let cursor = 0;
  for (const match of markdown.matchAll(LINK)) {
    pushText(plain(markdown.slice(cursor, match.index)));
    const [whole, label, target, bare] = match;
    if (bare) {
      const trailing = bare.match(TRAILING_PUNCTUATION)?.[0] ?? '';
      const href = bare.slice(0, bare.length - trailing.length);
      segments.push({ kind: 'link', text: href, href });
      pushText(trailing);
    } else if (isHttpUrl(target)) {
      segments.push({ kind: 'link', text: plain(label), href: target });
    } else {
      pushText(plain(label));
    }
    cursor = match.index + whole.length;
  }
  pushText(plain(markdown.slice(cursor)));
  return segments;
}
