import type { Metadata } from 'next';

import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Terms of Service - DAOx' };

const SSV_TERMS = 'https://ssv.network/legal/terms-of-service';

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="19 October 2026">
      <p>
        DAOx (<code>daox.ssv.network</code>) is an interface for SSV Network DAO governance
        information and tooling. It is operated by SSV Foundation and its affiliates (the
        &ldquo;Company&rdquo;).
      </p>
      <p>
        Your use of DAOx is governed by the{' '}
        <a href={SSV_TERMS} target="_blank" rel="noopener noreferrer">
          SSV Network Terms of Service
        </a>
        , which apply to DAOx as if it were part of the &ldquo;Platform&rdquo; defined there. By
        using DAOx you agree to those terms, including the disclaimers, limitation of liability,
        governing law and dispute resolution provisions. If you do not agree, do not use DAOx.
      </p>

      <h2>DAOx specifics</h2>
      <ul>
        <li>
          DAOx is provided &ldquo;as is&rdquo;. Delegate scores, voting data, timelines and
          AI-generated summaries or answers are informational, may be incomplete or wrong, and are
          not investment, legal or tax advice. Verify anything important at the source.
        </li>
        <li>
          DAOx is non-custodial. Wallet connections, signatures and on-chain transactions (including
          delegation and score opt-out) are made with your own wallet at your own risk. Blockchain
          transactions cannot be reversed.
        </li>
        <li>
          Third-party services (for example Snapshot, wallets and blockchain infrastructure) are
          outside our control and subject to their own terms.
        </li>
        <li>
          You must not misuse DAOx, including by scraping it at scale, overloading it, or
          circumventing its rate limits.
        </li>
      </ul>

      <h2>Changes and contact</h2>
      <p>
        We may update this page and the Terms at any time; continued use means you accept the
        update. Questions: <a href="mailto:hello@ssv.network">hello@ssv.network</a>.
      </p>
    </LegalPage>
  );
}
