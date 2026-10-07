"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      setIsDark(true);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') === 'dark';
    const nextTheme = currentTheme ? 'light' : 'dark';
    root.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setIsDark(!currentTheme);
  };

  if (!mounted) {
    return (
      <button 
        style={{
          background: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          width: '36px', height: '36px',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-secondary)',
          visibility: 'hidden'
        }}
      />
    );
  }

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: 'var(--surface-secondary)',
        border: '1px solid var(--border)',
        width: '36px', height: '36px',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--ink-secondary)',
        transition: 'all 0.2s'
      }}
      aria-label="Toggle theme"
    >
      {isDark ? '☀' : '◐'}
    </button>
  );
}
