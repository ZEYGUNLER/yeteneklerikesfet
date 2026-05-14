import { palette } from '../tokens';

export const childTheme = {
  id: 'child',
  colors: {
    primary: palette.violet[600],
    secondary: palette.teal[600],
    accent: palette.amber[500],
    background: palette.slate[900], // Dark immersive background
    surface: 'rgba(30, 41, 59, 0.6)', // Glassmorphism surface
    text: palette.white,
    textSecondary: palette.slate[300],
    border: 'rgba(255, 255, 255, 0.1)',
    success: palette.emerald[500],
    danger: palette.rose[500],
    card: 'rgba(255, 255, 255, 0.05)',
  },
  radius: {
    card: 24,
    button: 20,
    input: 16,
  },
  shadows: {
    none: { elevation: 0 },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: palette.violet[600],
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    }
  }
};
