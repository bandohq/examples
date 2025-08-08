import { createTheme } from '@mui/material/styles';

// Bando.cool inspired color palette
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0066FF', // Bold blue as primary color
      light: '#4B9AFF',
      dark: '#0047B3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF6B00', // Orange for accents
      light: '#FF9240',
      dark: '#CC5500',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF3B30',
    },
    warning: {
      main: '#FF9500',
    },
    info: {
      main: '#34C7FF',
    },
    success: {
      main: '#2ECC71',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
      default2: '#F0F2F5',
    },
    text: {
      primary: '#0A1929',
      secondary: '#52667A',
      disabled: '#A0AEC0',
    },
    divider: '#E2E8F0',
    action: {
      active: '#0066FF',
      hover: 'rgba(0, 102, 255, 0.04)',
      selected: 'rgba(0, 102, 255, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          overflow: 'hidden',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

export default theme;
