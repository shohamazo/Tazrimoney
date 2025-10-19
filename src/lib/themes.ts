
export type ColorScheme = {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  'sidebar-background': string;
  'sidebar-foreground': string;
  'sidebar-primary': string;
  'sidebar-primary-foreground': string;
  'sidebar-accent': string;
  'sidebar-accent-foreground': string;
  'sidebar-border': string;
  'sidebar-ring': string;
};

export type Theme = {
  name: string;
  label: string;
  colors: {
    light: Partial<ColorScheme>;
    dark: Partial<ColorScheme>;
  };
};

export const themes: { [key: string]: Theme } = {
  default: {
    name: 'default',
    label: 'ברירת מחדל',
    colors: {
      light: {
        background: '0 0% 96.1%',
        foreground: '235 63% 20%',
        primary: '235 63% 30%',
        'primary-foreground': '0 0% 98%',
        accent: '55 99% 61.6%',
        'accent-foreground': '235 63% 15%',
        'sidebar-background': '235 63% 30%',
      },
      dark: {
        background: '233 30% 11%',
        foreground: '0 0% 98%',
        primary: '235 63% 55%',
        'primary-foreground': '0 0% 98%',
        accent: '55 99% 61.6%',
        'accent-foreground': '235 63% 15%',
        'sidebar-background': '233 30% 14%',
      },
    },
  },
  ocean: {
    name: 'ocean',
    label: 'אוקיינוס',
    colors: {
      light: {
        background: '210 100% 99%',
        foreground: '215 30% 35%',
        primary: '210 80% 65%',
        'primary-foreground': '210 40% 98%',
        accent: '180 70% 55%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '210 80% 90%',
        'sidebar-foreground': '215 30% 35%',
      },
      dark: {
        background: '222 47% 11%',
        foreground: '210 40% 98%',
        primary: '210 70% 55%',
        'primary-foreground': '210 40% 98%',
        accent: '180 60% 45%',
        'accent-foreground': '210 40% 98%',
        'sidebar-background': '222 40% 15%',
        'sidebar-foreground': '210 40% 92%',
      },
    },
  },
  sunset: {
    name: 'sunset',
    label: 'שקיעה',
    colors: {
      light: {
        background: '30 100% 99%',
        foreground: '25 40% 30%',
        primary: '30 90% 70%',
        'primary-foreground': '25 40% 20%',
        accent: '0 85% 75%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '30 90% 92%',
        'sidebar-foreground': '25 40% 30%',
      },
      dark: {
        background: '20 20% 12%',
        foreground: '30 30% 90%',
        primary: '30 80% 60%',
        'primary-foreground': '25 40% 10%',
        accent: '0 75% 65%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '20 15% 16%',
        'sidebar-foreground': '30 30% 90%',
      },
    },
  },
  forest: {
    name: 'forest',
    label: 'יער',
    colors: {
      light: {
        background: '100 30% 98%',
        foreground: '120 25% 30%',
        primary: '130 60% 65%',
        'primary-foreground': '120 25% 15%',
        accent: '90 55% 60%',
        'accent-foreground': '90 25% 15%',
        'sidebar-background': '130 60% 90%',
        'sidebar-foreground': '120 25% 30%',
      },
      dark: {
        background: '120 15% 12%',
        foreground: '100 15% 90%',
        primary: '130 50% 55%',
        'primary-foreground': '120 25% 10%',
        accent: '90 45% 50%',
        'accent-foreground': '90 15% 95%',
        'sidebar-background': '120 15% 16%',
        'sidebar-foreground': '100 15% 85%',
      },
    },
  },
};
