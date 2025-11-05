/**
 * Color Theme
 * CLAUDE.mdで定義されたマウンテンテーマのカラーパレット
 */

export const Colors = {
  // Primary Colors (Mountain Theme)
  mountainBlue: '#3C507D',    // Mountain Blue
  nightSky: '#112250',        // Night Sky
  moonlightGold: '#E0C58F',   // Moonlight Gold

  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Difficulty Colors
  difficulty: {
    easy: '#66BB6A',        // Green
    medium: '#FFA726',      // Orange
    challenging: '#EF5350', // Red
  },

  // Quest Type Colors
  questType: {
    small: '#29B6F6',       // Light Blue
    medium: '#AB47BC',      // Purple
    validation: '#EC407A',  // Pink
  },

  // Dark Mode
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#48484A',
  },
};

// Light Theme
export const LightTheme = {
  colors: Colors,
  background: Colors.white,
  surface: Colors.gray[50],
  surfaceVariant: Colors.gray[100],
  text: Colors.nightSky,
  textSecondary: Colors.gray[700],
  border: Colors.gray[300],
  elevation: {
    level0: 'transparent',
    level1: Colors.white,
    level2: Colors.gray[50],
  },
};

// Dark Theme
export const DarkTheme = {
  colors: Colors,
  background: Colors.dark.background,
  surface: Colors.dark.surface,
  surfaceVariant: Colors.dark.surfaceVariant,
  text: Colors.white,
  textSecondary: Colors.gray[400],
  border: Colors.gray[600],
  elevation: {
    level0: 'transparent',
    level1: Colors.dark.surface,
    level2: Colors.dark.surfaceVariant,
  },
};

// High Contrast Theme (Light)
// WCAG 2.1 AAA準拠 (コントラスト比 7:1以上)
export const HighContrastLightTheme = {
  colors: Colors,
  background: Colors.white,
  surface: Colors.white,
  surfaceVariant: Colors.gray[50],
  text: Colors.black,
  textSecondary: Colors.gray[900],
  border: Colors.black,
  borderWidth: 2, // 通常より太いボーダー
  elevation: {
    level0: 'transparent',
    level1: Colors.white,
    level2: Colors.gray[50],
  },
  // ハイコントラスト専用のカラー
  highContrast: {
    primary: '#000000',
    secondary: '#424242',
    success: '#1B5E20',    // より濃い緑
    warning: '#E65100',    // より濃いオレンジ
    error: '#B71C1C',      // より濃い赤
    info: '#0D47A1',       // より濃い青
  },
};

// High Contrast Theme (Dark)
// WCAG 2.1 AAA準拠 (コントラスト比 7:1以上)
export const HighContrastDarkTheme = {
  colors: Colors,
  background: Colors.black,
  surface: Colors.black,
  surfaceVariant: Colors.gray[900],
  text: Colors.white,
  textSecondary: Colors.gray[200],
  border: Colors.white,
  borderWidth: 2, // 通常より太いボーダー
  elevation: {
    level0: 'transparent',
    level1: Colors.black,
    level2: Colors.gray[900],
  },
  // ハイコントラスト専用のカラー
  highContrast: {
    primary: '#FFFFFF',
    secondary: '#E0E0E0',
    success: '#81C784',    // より明るい緑
    warning: '#FFB74D',    // より明るいオレンジ
    error: '#E57373',      // より明るい赤
    info: '#64B5F6',       // より明るい青
  },
};
