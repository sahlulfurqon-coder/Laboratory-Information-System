// pages/analysis/_theme.js
// Shared design tokens for Analysis module
// Aesthetic: Clean Functional — White background, thin borders, Emerald & Amber accents

export const theme = {
  colors: {
    bg:          '#ffffff',
    surface:     '#f9fafb', // Slate 50
    surfaceAlt:  '#f3f4f6', // Slate 100
    border:      '#e5e7eb', // Gray 200
    borderHover: '#d1d5db', // Gray 300
    accent:      '#10b981', // Emerald 500 (Hijau)
    accentLight: '#d1fae5', 
    warning:     '#f59e0b', // Amber 500 (Kuning)
    warningLight:'#fef3c7',
    danger:      '#ef4444', 
    text:        '#111827', // Gray 900
    textMuted:   '#6b7280', // Gray 500
    textDim:     '#9ca3af', // Gray 400
  },
}

export const STATUS_COLORS = {
  pending:   '#f59e0b', // Amber
  submitted: '#3b82f6', // Blue[cite: 1]
  approved:  '#10b981', // Emerald[cite: 1]
  rejected:  '#ef4444', // Red[cite: 1]
}

export const PASS_FAIL_COLORS = {
  pass: '#10b981', // Hijau[cite: 1]
  fail: '#ef4444', // Merah[cite: 1]
  na:   '#9ca3af', // Gray[cite: 1]
}