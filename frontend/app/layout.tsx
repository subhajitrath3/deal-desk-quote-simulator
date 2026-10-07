import type { Metadata } from "next";
import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle";
import { Navigation } from "../components/Navigation";

export const metadata: Metadata = {
  title: "Deal Desk | Quote Workspace",
  description: "Enterprise SaaS Quoting Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Background Detailing */}
        <div className="bg-decoration">
          <div className="bg-glow-orange"></div>
          <div className="bg-glow-orange-right"></div>
          <div className="bg-grid"></div>
        </div>

        {/* Premium Capsule Navigation */}
        <div style={{ position: 'sticky', top: '1.5rem', zIndex: 50, padding: '0 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
          <header style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '999px',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundColor: 'color-mix(in srgb, var(--surface) 90%, transparent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5Z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Deal Desk<span style={{ color: 'var(--accent)' }}>.</span>
            </div>
            
            <Navigation />

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ThemeToggle />
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                JS
              </div>
            </div>
          </header>
        </div>

        <main style={{ maxWidth: '1400px', margin: '3rem auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
