import { createTheme } from '@mui/material/styles';

// Design system from PRD:
// Theme: Minimalistic, modern dark mode
// Color Palette:
// - Primary: Aqua Blue (#00BFFF)
// - Background: Dark Grey/Black (#121212)
// - Surface Elements: Slightly lighter grey (#1E1E1E, #2D2D2D)
// - Text: White (#FFFFFF) and Light Grey (#E0E0E0)
// - Accents: Medium Grey (#808080), Darker Aqua (#0099CC) for depth
// - Visualization Colors:
//   - Referral Nodes: Aqua Blue (#00BFFF)
//   - Member Nodes: Light Grey (#E0E0E0)
//   - Multiple Referrer Connections: Grey to Aqua gradient

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00BFFF', // Aqua Blue
      dark: '#0099CC', // Darker Aqua
      light: '#33CCFF', // Lighter Aqua
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#808080', // Medium Grey
      dark: '#616161',
      light: '#A0A0A0',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#121212', // Dark Grey/Black
      paper: '#1E1E1E', // Slightly lighter grey
    },
    surface: {
      main: '#1E1E1E',
      dark: '#121212',
      light: '#2D2D2D',
    },
    text: {
      primary: '#FFFFFF', // White
      secondary: '#E0E0E0', // Light Grey
    },
    visualization: {
      referral: '#00BFFF', // Referral Nodes: Aqua Blue
      member: '#E0E0E0', // Member Nodes: Light Grey
    },
    error: {
      main: '#FF5252',
    },
    warning: {
      main: '#FFB74D',
    },
    info: {
      main: '#4FC3F7',
    },
    success: {
      main: '#66BB6A',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
    },
    button: {
      fontWeight: 500,
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
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 20px',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#0099CC', // Darker shade on hover
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1E1E1E',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
          borderRadius: 8,
          border: '1px solid #2D2D2D',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#121212',
          boxShadow: 'none',
          borderBottom: '1px solid #2D2D2D',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#121212',
          borderRight: '1px solid #2D2D2D',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#2D2D2D',
            },
            '&:hover fieldset': {
              borderColor: '#00BFFF',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00BFFF',
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#00BFFF',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&.Mui-selected': {
            color: '#00BFFF',
          },
        },
      },
    },
  },
});

export default theme; 