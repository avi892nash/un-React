/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neutral cool-grey scale — surfaces, borders, text
        'background':                '#0e0e11',
        'surface':                   '#141418',
        'surface-dim':               '#0e0e11',
        'surface-container-lowest':  '#0a0a0d',
        'surface-container-low':     '#18181c',
        'surface-container':         '#1d1d22',
        'surface-container-high':    '#25252b',
        'surface-container-highest': '#2e2e35',
        'surface-bright':            '#3a3a42',
        'surface-variant':           '#2e2e35',

        'outline-variant':           '#2f2f37',
        'outline':                   '#4e4e58',

        'on-background':             '#ececef',
        'on-surface':                '#ececef',
        'on-surface-variant':        '#a8a8b0',
        'inverse-surface':           '#ececef',
        'inverse-on-surface':        '#1d1d22',

        // Primary = white / near-white — used for Run button + emphasis
        'primary':                   '#f0f0f3',
        'on-primary':                '#0a0a0d',
        'primary-fixed':             '#ececef',
        'primary-fixed-dim':         '#d4d4d8',
        'primary-container':         '#2e2e35',   // subtle grey pill for active states
        'on-primary-container':      '#ececef',
        'inverse-primary':           '#1d1d22',
        'surface-tint':              '#a8a8b0',

        // Secondary = same neutral, slightly less saturated for chips/avatars
        'secondary':                 '#c6c6cb',
        'on-secondary':              '#1d1d22',
        'secondary-container':       '#2e2e35',
        'on-secondary-container':    '#d4d4d8',
        'secondary-fixed':           '#e2e2e6',
        'secondary-fixed-dim':       '#c6c6cb',

        // Semantic — green / red / amber
        'pass':                      '#4ade80',
        'pass-container':            '#15281a',
        'on-pass-container':         '#b9f0c6',
        'error':                     '#f87171',
        'error-container':           '#2a1518',
        'on-error-container':        '#fecaca',
        'on-error':                  '#1a0608',
        'tertiary':                  '#fbbf24',
        'tertiary-container':        '#2a2010',
        'on-tertiary':               '#1a1206',
        'on-tertiary-container':     '#fde68a',
        'on-tertiary-fixed':         '#7b6500',
        'on-tertiary-fixed-variant': '#5a4900',
        'tertiary-fixed':            '#fde68a',
        'tertiary-fixed-dim':        '#fbbf24',
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem',
      },
      spacing: {
        'margin-mobile': '16px',
        'max-width': '1280px',
        'gutter': '16px',
        'unit': '4px',
        'margin-desktop': '32px',
      },
      fontFamily: {
        'body-lg': ['Inter', 'system-ui', 'sans-serif'],
        'body-md': ['Inter', 'system-ui', 'sans-serif'],
        'label-sm': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        'headline-lg': ['Inter', 'system-ui', 'sans-serif'],
        'code-block': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        'code-inline': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        'headline-xl': ['Inter', 'system-ui', 'sans-serif'],
        'headline-md': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'code-block': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'code-inline': ['13px', { lineHeight: '16px', fontWeight: '500' }],
        'headline-xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['18px', { lineHeight: '24px', fontWeight: '600' }],
      },
      keyframes: {
        // Soft attention pulse on the "you are here" sidebar bullet.
        // Lower-amplitude than Tailwind's built-in animate-pulse so it
        // doesn't distract from reading.
        'bullet-pulse': {
          '0%, 100%': { transform: 'scale(1)',   boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.55)' },
          '50%':      { transform: 'scale(1.1)', boxShadow: '0 0 0 6px rgba(251, 191, 36, 0)' },
        },
        // Slide-up + fade-in for the result banner and completion view.
        'rise-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Modal/dialog entrance — quick fade with a tiny scale-up to feel
        // anchored rather than dropped in.
        'pop-in': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Sidebar new-entry slide — when the Completion row first appears
        // after the last step passes, slide in from the left.
        'slide-in-x': {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'bullet-pulse': 'bullet-pulse 1.8s ease-in-out infinite',
        'rise-in':      'rise-in 220ms ease-out both',
        'pop-in':       'pop-in 160ms ease-out both',
        'slide-in-x':   'slide-in-x 280ms ease-out both',
      },
    },
  },
  plugins: [],
};
