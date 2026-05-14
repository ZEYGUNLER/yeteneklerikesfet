import React, { createContext, useContext, useMemo } from 'react';
import { childTheme } from './themes/childTheme';
import { parentTheme } from './themes/parentTheme';
import { spacing, radius, palette } from './tokens';
import { typography, textStyles } from './typography';

export type Theme = typeof parentTheme;
export type WorldType = 'child' | 'parent';

interface ThemeContextType {
  theme: Theme;
  world: WorldType;
  spacing: typeof spacing;
  typography: typeof typography;
  textStyles: typeof textStyles;
  radius: typeof radius;
  palette: typeof palette;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ 
  children, 
  world = 'parent' 
}: { 
  children: React.ReactNode; 
  world?: WorldType;
}) => {
  const value = useMemo(() => {
    const activeTheme = world === 'child' ? childTheme : parentTheme;
    return {
      theme: activeTheme as Theme,
      world,
      spacing,
      typography,
      textStyles,
      radius,
      palette,
    };
  }, [world]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Also export everything for direct access if needed (outside components)
export { spacing, radius, palette, typography, textStyles, childTheme, parentTheme };
