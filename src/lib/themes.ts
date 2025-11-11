
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
        background: '222.2 47.4% 97.5%',
        foreground: '222.2 47.4% 11.2%',
        primary: '215 50% 48%',
        'primary-foreground': '210 40% 98%',
        accent: '170 80% 45%',
        'accent-foreground': '210 40% 98%',
        'sidebar-background': '215 50% 48%',
        'sidebar-foreground': '210 40% 98%',
        'sidebar-primary': '170 80% 45%',
        'sidebar-primary-foreground': '210 40% 98%',
        'sidebar-accent': '215 50% 58%',
        'sidebar-accent-foreground': '210 40% 98%',
        'sidebar-border': '215 50% 58%',
        'sidebar-ring': '170 80% 55%',
      },
      dark: {
        background: '222.2 47.4% 11.2%',
        foreground: '210 40% 98%',
        primary: '210 40% 98%',
        'primary-foreground': '222.2 47.4% 11.2%',
        accent: '170 80% 45%',
        'accent-foreground': '210 40% 98%',
        'sidebar-background': '222.2 47.4% 11.2%',
        'sidebar-foreground': '210 40% 98%',
        'sidebar-primary': '170 80% 45%',
        'sidebar-primary-foreground': '210 40% 98%',
        'sidebar-accent': '217.2 32.6% 22.5%',
        'sidebar-accent-foreground': '210 40% 98%',
        'sidebar-border': '217.2 32.6% 17.5%',
        'sidebar-ring': '170 80% 55%',
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
        'sidebar-background': '210 80% 97%',
        'sidebar-foreground': '215 30% 35%',
        'sidebar-accent': '210 80% 90%',
        'sidebar-accent-foreground': '215 30% 25%',
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
        'sidebar-accent': '222 40% 25%',
        'sidebar-accent-foreground': '210 40% 98%',
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
        'sidebar-background': '30 90% 97%',
        'sidebar-foreground': '25 40% 30%',
        'sidebar-accent': '30 90% 92%',
        'sidebar-accent-foreground': '25 40% 20%',
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
        'sidebar-accent': '20 15% 24%',
        'sidebar-accent-foreground': '30 30% 96%',
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
        'sidebar-background': '130 60% 97%',
        'sidebar-foreground': '120 25% 30%',
        'sidebar-accent': '130 60% 90%',
        'sidebar-accent-foreground': '120 25% 20%',
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
        'sidebar-accent': '120 15% 24%',
        'sidebar-accent-foreground': '100 15% 92%',
      },
    },
  },
    amethyst: {
    name: 'amethyst',
    label: 'אמטיסט',
    colors: {
      light: {
        background: '270 100% 99%',
        foreground: '270 30% 35%',
        primary: '270 70% 75%',
        'primary-foreground': '270 30% 15%',
        accent: '300 80% 80%',
        'accent-foreground': '300 30% 15%',
        'sidebar-background': '270 100% 98%',
        'sidebar-foreground': '270 30% 35%',
        'sidebar-accent': '270 100% 95%',
        'sidebar-accent-foreground': '270 30% 25%',
      },
      dark: {
        background: '270 20% 12%',
        foreground: '270 20% 90%',
        primary: '270 60% 65%',
        'primary-foreground': '270 20% 10%',
        accent: '300 50% 60%',
        'accent-foreground': '300 15% 95%',
        'sidebar-background': '270 15% 16%',
        'sidebar-foreground': '270 20% 85%',
        'sidebar-accent': '270 15% 24%',
        'sidebar-accent-foreground': '270 20% 92%',
      },
    },
  },
  mint: {
    name: 'mint',
    label: 'מנטה',
    colors: {
      light: {
        background: '150 100% 99%',
        foreground: '150 25% 30%',
        primary: '150 60% 65%',
        'primary-foreground': '150 25% 15%',
        accent: '170 70% 60%',
        'accent-foreground': '170 25% 15%',
        'sidebar-background': '150 80% 97%',
        'sidebar-foreground': '150 25% 30%',
        'sidebar-accent': '150 80% 92%',
        'sidebar-accent-foreground': '150 25% 20%',
      },
      dark: {
        background: '150 15% 12%',
        foreground: '150 15% 90%',
        primary: '150 50% 55%',
        'primary-foreground': '150 25% 10%',
        accent: '170 45% 50%',
        'accent-foreground': '170 15% 95%',
        'sidebar-background': '150 15% 16%',
        'sidebar-foreground': '150 15% 85%',
        'sidebar-accent': '150 15% 24%',
        'sidebar-accent-foreground': '150 15% 92%',
      },
    },
  },
  blush: {
    name: 'blush',
    label: 'סומק',
    colors: {
      light: {
        background: '350 100% 99%',
        foreground: '350 30% 35%',
        primary: '350 80% 80%',
        'primary-foreground': '350 30% 15%',
        accent: '25 90% 75%',
        'accent-foreground': '25 30% 15%',
        'sidebar-background': '350 100% 98%',
        'sidebar-foreground': '350 30% 35%',
        'sidebar-accent': '350 100% 96%',
        'sidebar-accent-foreground': '350 30% 25%',
      },
      dark: {
        background: '350 15% 12%',
        foreground: '350 20% 90%',
        primary: '350 60% 70%',
        'primary-foreground': '350 20% 10%',
        accent: '25 70% 65%',
        'accent-foreground': '25 15% 95%',
        'sidebar-background': '350 15% 16%',
        'sidebar-foreground': '350 20% 85%',
        'sidebar-accent': '350 15% 24%',
        'sidebar-accent-foreground': '350 20% 92%',
      },
    },
  },
  monochrome: {
    name: 'monochrome',
    label: 'מונוכרום',
    colors: {
      light: {
        background: '0 0% 98%',
        foreground: '0 0% 20%',
        primary: '0 0% 40%',
        'primary-foreground': '0 0% 98%',
        accent: '0 0% 55%',
        'accent-foreground': '0 0% 100%',
        'sidebar-background': '0 0% 95%',
        'sidebar-foreground': '0 0% 20%',
        'sidebar-accent': '0 0% 90%',
        'sidebar-accent-foreground': '0 0% 15%',
      },
      dark: {
        background: '0 0% 12%',
        foreground: '0 0% 85%',
        primary: '0 0% 70%',
        'primary-foreground': '0 0% 10%',
        accent: '0 0% 50%',
        'accent-foreground': '0 0% 95%',
        'sidebar-background': '0 0% 16%',
        'sidebar-foreground': '0 0% 85%',
        'sidebar-accent': '0 0% 24%',
        'sidebar-accent-foreground': '0 0% 92%',
      },
    },
  },
};

    
