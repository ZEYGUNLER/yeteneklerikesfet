import { palette } from '../tokens';

export const parentTheme = {
  id: 'parent',
  colors: {
    primary: palette.blue[600],
    secondary: palette.slate[600],
    accent: palette.indigo[500],
    background: palette.slate[50], // Professional bright background
    surface: palette.white,
    text: palette.slate[900],
    textSecondary: palette.slate[500],
    border: palette.slate[200],
    success: palette.emerald[600],
    danger: palette.rose[600],
    card: palette.white,
  },
  radius: {
    card: 16,
    button: 12,
    input: 12,
  },
  shadows: {
    none: { elevation: 0 },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
    }
  }
};
