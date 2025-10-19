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
        background: '205 50% 95%',
        foreground: '215 35% 25%',
        primary: '210 100% 40%',
        'primary-foreground': '0 0% 100%',
        accent: '180 80% 45%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '210 100% 40%',
      },
      dark: {
        background: '215 30% 10%',
        foreground: '205 30% 90%',
        primary: '210 90% 60%',
        'primary-foreground': '0 0% 100%',
        accent: '180 70% 50%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '215 30% 15%',
      },
    },
  },
  sunset: {
    name: 'sunset',
    label: 'שקיעה',
    colors: {
      light: {
        background: '30 100% 97%',
        foreground: '25 40% 20%',
        primary: '15 90% 55%',
        'primary-foreground': '0 0% 100%',
        accent: '350 90% 65%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '15 90% 55%',
      },
      dark: {
        background: '20 20% 8%',
        foreground: '30 30% 90%',
        primary: '25 90% 60%',
        'primary-foreground': '0 0% 100%',
        accent: '350 80% 60%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '20 20% 12%',
      },
    },
  },
  forest: {
    name: 'forest',
    label: 'יער',
    colors: {
      light: {
        background: '100 20% 96%',
        foreground: '120 25% 20%',
        primary: '130 40% 40%',
        'primary-foreground': '0 0% 100%',
        accent: '40 60% 50%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '130 40% 40%',
      },
      dark: {
        background: '120 15% 10%',
        foreground: '100 15% 90%',
        primary: '130 40% 55%',
        'primary-foreground': '0 0% 100%',
        accent: '40 50% 55%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '120 15% 15%',
      },
    },
  },
};
