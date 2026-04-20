/**
 * CodeSenseAI – Global Theme System (v2)
 *
 * Full semantic token palette for 5 themes.
 * applyTheme() writes ALL tokens to :root so every component
 * using var(--color-*) or the .bg-panel / .text-themed-* utility
 * classes updates instantly — no React re-render required.
 */

export type ThemeKey = 'indigo' | 'white' | 'crimson' | 'inkblack' | 'onyx';

export interface ThemeTokens {
  /* ── Backgrounds ─────────────────────────── */
  '--color-bg-base':       string; // page background
  '--color-surface':       string; // card / panel background
  '--color-surface-low':   string; // sidebar, lower-elevation surfaces
  '--color-surface-high':  string; // elevated card / hover surface

  /* ── Brand ───────────────────────────────── */
  '--color-accent':        string; // primary action color  (buttons, links)
  '--color-accent-hover':  string; // darken on hover
  '--color-accent-subtle': string; // accent at ~15% opacity (bg tints)
  '--color-accent-glow':   string; // accent for bar-chart glow + shadows

  /* ── Typography ──────────────────────────── */
  '--color-text-primary':  string; // headings, values
  '--color-text-muted':    string; // labels, placeholders

  /* ── Borders ─────────────────────────────── */
  '--color-border':        string; // card/input borders
}

export const THEMES: Record<ThemeKey, ThemeTokens> = {

  /* ─── INDIGO (default dark) ──────────────────────────────── */
  indigo: {
    '--color-bg-base':       '#0a0316',
    '--color-surface':       '#0d0420',
    '--color-surface-low':   '#0f0724',
    '--color-surface-high':  '#21172d',
    '--color-accent':        '#6366f1',
    '--color-accent-hover':  '#4f46e5',
    '--color-accent-subtle': 'rgba(99, 102, 241, 0.15)',
    '--color-accent-glow':   'rgba(99, 102, 241, 0.5)',
    '--color-text-primary':  '#e8e4f0',
    '--color-text-muted':    '#7a7090',
    '--color-border':        'rgba(255, 255, 255, 0.06)',
  },

  /* ─── WHITE (light / clean) ──────────────────────────────── */
  white: {
    '--color-bg-base':       '#f8fafc',
    '--color-surface':       '#ffffff',
    '--color-surface-low':   '#f1f5f9',
    '--color-surface-high':  '#e2e8f0',
    '--color-accent':        '#2563eb',
    '--color-accent-hover':  '#1d4ed8',
    '--color-accent-subtle': 'rgba(37, 99, 235, 0.10)',
    '--color-accent-glow':   'rgba(37, 99, 235, 0.35)',
    '--color-text-primary':  '#1e293b',
    '--color-text-muted':    '#64748b',
    '--color-border':        'rgba(0, 0, 0, 0.08)',
  },

  /* ─── CRIMSON (aggressive / alert) ──────────────────────── */
  crimson: {
    '--color-bg-base':       '#1a0005',
    '--color-surface':       '#2d000a',
    '--color-surface-low':   '#200008',
    '--color-surface-high':  '#3d0010',
    '--color-accent':        '#8F0013',
    '--color-accent-hover':  '#6B000E',
    '--color-accent-subtle': 'rgba(143, 0, 19, 0.15)',
    '--color-accent-glow':   'rgba(225, 29, 72, 0.45)',
    '--color-text-primary':  '#fce4ec',
    '--color-text-muted':    '#d48b98',
    '--color-border':        'rgba(255, 255, 255, 0.06)',
  },

  /* ─── INK BLACK (deep / cyber) ───────────────────────────── */
  inkblack: {
    '--color-bg-base':       '#040B20',
    '--color-surface':       '#0B1437',
    '--color-surface-low':   '#071020',
    '--color-surface-high':  '#112040',
    '--color-accent':        '#38BDF8',
    '--color-accent-hover':  '#0284C7',
    '--color-accent-subtle': 'rgba(56, 189, 248, 0.12)',
    '--color-accent-glow':   'rgba(125, 211, 252, 0.45)',
    '--color-text-primary':  '#e2e8f0',
    '--color-text-muted':    '#94a3b8',
    '--color-border':        'rgba(255, 255, 255, 0.06)',
  },

  /* ─── ONYX (minimal / hacker) ────────────────────────────── */
  onyx: {
    '--color-bg-base':       '#070A0D',
    '--color-surface':       '#13181E',
    '--color-surface-low':   '#0c0e12',
    '--color-surface-high':  '#1a1d22',
    '--color-accent':        '#14B8A6',
    '--color-accent-hover':  '#0F766E',
    '--color-accent-subtle': 'rgba(20, 184, 166, 0.12)',
    '--color-accent-glow':   'rgba(45, 212, 191, 0.45)',
    '--color-text-primary':  '#d1d5db',
    '--color-text-muted':    '#9ca3af',
    '--color-border':        'rgba(255, 255, 255, 0.06)',
  },
};

/** Catalogue for the UI theme picker (swatch data) */
export const THEME_CATALOGUE = [
  { key: 'indigo'   as ThemeKey, label: 'Indigo',       swatchBg: '#0a0316', swatchAccent: '#6366f1', isLight: false },
  { key: 'white'    as ThemeKey, label: 'White',        swatchBg: '#f8fafc', swatchAccent: '#2563eb', isLight: true  },
  { key: 'crimson'  as ThemeKey, label: 'Deep Crimson', swatchBg: '#1a0005', swatchAccent: '#8F0013', isLight: false },
  { key: 'inkblack' as ThemeKey, label: 'Ink Black',    swatchBg: '#040B20', swatchAccent: '#38BDF8', isLight: false },
  { key: 'onyx'     as ThemeKey, label: 'Onyx',         swatchBg: '#070A0D', swatchAccent: '#14B8A6', isLight: false },
] as const;

/**
 * Read the current accent color from the live :root.
 * Used by canvas-based charts (bar heights, arc fills) that need a raw hex.
 */
export function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Apply a theme globally. Writes CSS custom properties to :root.
 * Every component using var(--color-*) or the semantic CSS utility
 * classes (bg-panel, nav-active, text-themed-*…) updates instantly.
 */
export function applyTheme(key: ThemeKey): void {
  const tokens = THEMES[key] ?? THEMES.indigo;
  const root   = document.documentElement;
  (Object.entries(tokens) as [string, string][]).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
  localStorage.setItem('codesense-theme', key);
}

/**
 * Re-apply the theme that was last saved in localStorage.
 * Call BEFORE React renders to prevent flash-of-wrong-theme.
 */
export function applyStoredTheme(): void {
  const saved = (localStorage.getItem('codesense-theme') ?? 'indigo') as ThemeKey;
  applyTheme(THEMES[saved] ? saved : 'indigo');
}
