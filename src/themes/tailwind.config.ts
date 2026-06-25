import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        cv: {
          bg:           'var(--cv-bg)',
          'bg-2':       'var(--cv-bg-secondary)',
          sidebar:      'var(--cv-sidebar)',
          card:         'var(--cv-card)',
          border:       'var(--cv-border)',
          accent:       'var(--cv-accent)',
          'accent-h':   'var(--cv-accent-hover)',
          'accent-m':   'var(--cv-accent-muted)',
          text:         'var(--cv-text)',
          muted:        'var(--cv-text-muted)',
          subtle:       'var(--cv-text-subtle)',
        },
      },
      borderRadius: {
        cv:     'var(--cv-radius-card)',
        'cv-btn': 'var(--cv-radius-btn)',
      },
      transitionProperty: {
        cv: 'var(--cv-transition)',
      },
      spacing: {
        cv: 'var(--cv-spacing-base)',
      },
    },
  },
  plugins: [],
} satisfies Config;
