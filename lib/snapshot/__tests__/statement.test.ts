import { describe, expect, it } from 'vitest';

import { statementSegments } from '../utils/statement';

describe('statementSegments', () => {
  it('turns Markdown links and bare URLs into links', () => {
    expect(
      statementSegments(
        'Dashboard: [Dune](https://dune.com/spookyg). Forum https://forum.ssv.network',
      ),
    ).toEqual([
      { kind: 'text', text: 'Dashboard: ' },
      { kind: 'link', text: 'Dune', href: 'https://dune.com/spookyg' },
      { kind: 'text', text: '. Forum ' },
      { kind: 'link', text: 'https://forum.ssv.network', href: 'https://forum.ssv.network' },
    ]);
  });

  it('keeps a non-http Markdown link as its label', () => {
    expect(statementSegments('[click](javascript:alert(1))')).toEqual([
      { kind: 'text', text: 'click' },
    ]);
  });

  it('drops Markdown emphasis and hard-break backslashes', () => {
    expect(statementSegments('**Bold** and _calm_  \\\nnext')).toEqual([
      { kind: 'text', text: 'Bold and calm  \nnext' },
    ]);
  });
});
