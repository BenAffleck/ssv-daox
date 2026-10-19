import type { Metadata } from 'next';
import Link from 'next/link';

import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy - DAOx' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="19 October 2026">
      <p>
        This policy covers DAOx (<code>daox.ssv.network</code>), operated by SSV Foundation (the
        &ldquo;Company&rdquo;, &ldquo;we&rdquo;). DAOx is open source; the source code is the
        authoritative description of what it does. We keep data collection to a minimum.
      </p>

      <h2>What we process</h2>
      <ul>
        <li>
          <strong>Hosting data.</strong> DAOx is hosted on Vercel, which processes technical request
          data (such as IP address, browser and request metadata) to serve the site and keep it
          secure.
        </li>
        <li>
          <strong>Wallet addresses.</strong> Addresses you enter, or connect with a wallet, are used
          to look up public blockchain, ENS, Snapshot and delegate-score data. We do not create
          accounts and do not receive your private keys.
        </li>
        <li>
          <strong>Score opt-out / opt-in.</strong> If you submit one, we process your address, your
          signature and a nonce and timestamp to verify and apply the request, and pass the request
          on to the delegate score service.
        </li>
        <li>
          <strong>AI features.</strong> Questions you ask about a proposal, and the proposal text,
          are sent to Anthropic to generate an answer. Do not enter personal information.
        </li>
        <li>
          <strong>Browser storage.</strong> Your theme choice is kept in local storage on your
          device. We do not use advertising or analytics trackers. Wallet providers you connect may
          store their own data in your browser.
        </li>
      </ul>

      <h2>Third parties</h2>
      <p>
        To work, DAOx calls third-party services that see the data needed for the request, including
        your IP address where your browser contacts them directly: Vercel (hosting), Snapshot
        (governance data), the SSV Delegate Score API, Safe Transaction Service, an Ethereum RPC
        provider, stamp.fyi (avatars), WalletConnect (if you use it) and Anthropic (AI features).
        Their own privacy policies apply.
      </p>

      <h2>Blockchain data</h2>
      <p>
        Wallet addresses, transactions and votes are public on blockchains and Snapshot. We cannot
        edit or delete them.
      </p>

      <h2>Retention, sharing and your rights</h2>
      <p>
        We keep data only as long as needed to operate and secure DAOx or meet legal obligations,
        and do not sell personal data. Depending on where you live, you may have the right to
        access, correct or delete data we hold about you, or to object to its processing. Contact us
        to exercise these rights. DAOx is not intended for anyone under 18. Data may be processed
        outside your country, including by our providers.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update this policy by posting the new version here. Contact:{' '}
        <a href="mailto:hello@ssv.network">hello@ssv.network</a>. Use of DAOx is also subject to our{' '}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalPage>
  );
}
