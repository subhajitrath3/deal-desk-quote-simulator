"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const isQuotesList = pathname.startsWith("/quotes");

  return (
    <nav style={{ display: 'flex', gap: '2rem', fontWeight: 600, fontSize: '0.9375rem' }}>
      <Link 
        href="/" 
        style={{ 
          color: !isQuotesList ? 'var(--ink)' : 'var(--ink-muted)', 
          textDecoration: 'none',
          transition: 'color 0.2s'
        }}
      >
        New Quote
      </Link>
      <Link 
        href="/quotes" 
        style={{ 
          color: isQuotesList ? 'var(--ink)' : 'var(--ink-muted)', 
          textDecoration: 'none',
          transition: 'color 0.2s'
        }}
      >
        Saved Quotes
      </Link>
    </nav>
  );
}
