export const theme = {
    colors: {
        primary: {
            50: '#f0f7ff',
            100: '#bccff1',
            200: '#90b4ff',
            300: '#5c8eff',
            400: '#3b6fff',
            500: '#1e4cff',
            600: '#1733db',
            700: '#1228b7',
            800: '#0d1d93',
            900: '#091570',
        },
        secondary: {
            50: '#fdf4ff',
            100: '#fae8ff',
            200: '#f5d0fe',
            300: '#f0abfc',
            400: '#e879f9',
            500: '#d946ef',
            600: '#c026d3',
            700: '#a21caf',
            800: '#86198f',
            900: '#701a75',
        },
        background: {
            light: '#ffffff',
            dark: '#1e1e1f',
            glass: 'rgba(255, 255, 255, 0.1)',
        },
        text: {
            primary: {
                light: '#1e1e1f',
                dark: '#ffffff',
            },
            secondary: {
                light: '#666666',
                dark: '#a0a0a0',
            },
        },
        border: {
            light: 'rgba(0, 0, 0, 0.1)',
            dark: 'rgba(255, 255, 255, 0.2)',
        },
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
    },
    borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '1rem',
        full: '9999px',
    },
    animation: {
        transition: {
            fast: '0.2s ease',
            normal: '0.3s ease',
            slow: '0.5s ease',
        },
    },
    typography: {
        fontFamily: {
            sans: 'Inter, system-ui, sans-serif',
            heading: 'Cal Sans, Inter, system-ui, sans-serif',
        },
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '2rem',
        },
        fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        },
    },
    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
} as const;

export type Theme = typeof theme; 