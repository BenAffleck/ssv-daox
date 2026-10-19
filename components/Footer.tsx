import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="container mx-auto flex max-w-7xl items-center justify-center gap-6 px-6 py-8 text-[13px] text-muted">
      <Link href="/terms" className="hover:text-foreground">
        Terms of Service
      </Link>
      <Link href="/privacy" className="hover:text-foreground">
        Privacy Policy
      </Link>
    </footer>
  );
}
