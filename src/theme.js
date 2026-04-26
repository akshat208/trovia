// src/theme.js
// ============================================
// THE EXPEDITION BRIEFING — CENTRAL DESIGN SYSTEM
// Single source of truth for all colors, radii, and transitions
// Inspired by premium dark aesthetic
// ============================================

export const T = {
  // ── Core Dark Theme Colors ──
  bg: '#0a0a0a',
  bgCard: '#121212',
  border: 'rgba(255, 255, 255, 0.08)',
  
  // ── Brand & Primary Action Colors ──
  primary: '#f97316',
  primaryDark: '#c2410c',
  accent: '#fb923c',

  // ── State & Feedback Colors ──
  success: '#22c55e',
  successLight: 'rgba(34, 197, 94, 0.1)',
  successBorder: 'rgba(34, 197, 94, 0.25)',
  error: '#ef4444',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  errorBorder: 'rgba(239, 68, 68, 0.25)',
  
  // ── Text Colors ──
  textPrimary: '#F1F5F9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',

  // ── UI Element Radii ──
  radius: {
    md: '12px',
    lg: '16px',
    xl: '20px',
  },

  // ── Transitions ──
  transition: {
    base: 'all 0.25s ease-in-out',
  },
};