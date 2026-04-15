/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: ["'Poppins'", "'Segoe UI'", "Tahoma", "Geneva", "Verdana", "sans-serif"],
      },
      colors: {
        djati: {
          bg: '#0d0f14',
          panel: '#151720',
          panel2: '#1a1c26',
          amber: '#ffb300',
          'amber-hover': '#ffc929',
          'amber-deep': '#f5a623',
          'amber-dark': '#e65100',
          border: 'rgba(255,255,255,0.06)',
          'border-light': 'rgba(255,255,255,0.12)',
          'border-amber': 'rgba(255,179,0,0.25)',
          white: '#ffffff',
          muted: 'rgba(255,255,255,0.45)',
          text: 'rgba(255,255,255,0.75)',
          'text-bright': '#e0e0e0',
          sidebar: '#111318',
        },
        status: {
          pending: '#ffb300',
          'pending-bg': 'rgba(255,179,0,0.15)',
          'pending-border': 'rgba(255,179,0,0.3)',
          progress: '#42a5f5',
          'progress-bg': 'rgba(33,150,243,0.15)',
          'progress-border': 'rgba(33,150,243,0.3)',
          critical: '#ef5350',
          'critical-bg': 'rgba(244,67,54,0.15)',
          'critical-border': 'rgba(244,67,54,0.3)',
          resolved: '#66bb6a',
          'resolved-bg': 'rgba(76,175,80,0.15)',
          'resolved-border': 'rgba(76,175,80,0.3)',
          inactive: '#9e9e9e',
          'inactive-bg': 'rgba(158,158,158,0.12)',
          'inactive-border': 'rgba(158,158,158,0.28)',
        },
      },
      boxShadow: {
        'amber-sm': '0 4px 16px rgba(255,179,0,0.25)',
        'amber-md': '0 8px 24px rgba(255,179,0,0.4)',
        'amber-lg': '0 12px 48px rgba(255,179,0,0.55)',
        'modal': '0 32px 80px rgba(0,0,0,0.6)',
        'card': '0 24px 64px rgba(0,0,0,0.65)',
        'red-sm': '0 4px 16px rgba(244,67,54,0.35)',
        'red-md': '0 8px 24px rgba(244,67,54,0.5)',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 1s ease-out',
      },
    },
  },
  plugins: [],
}
