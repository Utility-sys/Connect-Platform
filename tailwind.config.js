/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Core primary palette — logo steel-navy ─────────────────────
        primary: {
          DEFAULT:  '#0D1B2A',  // deep midnight navy (darkest)
          light:    '#1A3454',  // rich dark navy
          lighter:  '#2B5080',  // steel-blue navy
          steel:    '#3A6186',  // lighter steel (logo bg mid-tone)
        },

        // ── Accent palette — Refined Vibrant Logo Orange ──────────────
        accent: {
          DEFAULT: '#F66113',   // Vibrant brand orange
          gold:    '#FF8A05',   // Premium golden highlight
          fire:    '#FA4B08',   // Deep vibrant orange
          light:   '#FFB04D',   // Soft highlight
          blue:    '#155EEF',   // Vibrant brand blue
        },

        // ── Surfaces & backgrounds ─────────────────────────────────────
        background: '#F2F4F7',
        surface:    '#FFFFFF',

        // ── Text ──────────────────────────────────────────────────────
        textPrimary:   '#1A2533',
        textSecondary: '#5A6775',

        // ── Semantic ───────────────────────────────────────────────────
        success: '#16A34A',
        warning: '#B45309',
        error:   '#DC2626',
        border:  '#D4D9E0',
      },

      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body:    ['Outfit', 'sans-serif'],
      },

      backgroundImage: {
        // Hero: deep navy to steel gradient (logo background feel)
        'hero-gradient':    'linear-gradient(135deg, #0D1B2A 0%, #1A3454 45%, #2B5080 80%, #3A6186 100%)',
        // Fire: Refined Vibrant Logo Orange (used for headings / CTAs)
        'fire-gradient':    'linear-gradient(120deg, #FA4B08 0%, #F66113 45%, #FF8A05 100%)',
        // Navbar
        'nav-gradient':     'linear-gradient(90deg, #0D1B2A 0%, #1A3454 60%, #2B5080 100%)',
        // Card shimmer
        'card-gradient':    'linear-gradient(145deg, #0D1B2A 0%, #1A3454 100%)',
        // Accent subtle
        'glow-gradient':    'radial-gradient(ellipse at center, rgba(212,85,15,0.18) 0%, transparent 70%)',
      },

      boxShadow: {
        'fire':    '0 4px 24px rgba(212,85,15,0.35)',
        'fire-lg': '0 8px 40px rgba(212,85,15,0.45)',
        'navy':    '0 4px 24px rgba(13,27,42,0.45)',
        'glow':    '0 0 40px rgba(212,85,15,0.20)',
      },

      dropShadow: {
        'fire':   '0 2px 12px rgba(212,85,15,0.50)',
        'gold':   '0 2px 12px rgba(196,146,10,0.50)',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slow-zoom': 'slowZoom 20s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slowZoom: {
          '0%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1.2)' }
        }
      },
    },
  },
  plugins: [],
}
