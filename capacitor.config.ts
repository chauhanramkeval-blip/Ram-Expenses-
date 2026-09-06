export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    url?: string;
    cleartext?: boolean;
    androidScheme?: string;
  };
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.khata.financeadvisor',
  appName: 'Khata: Daily Expense & Finance Advisor',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // For live reload during development or Over-The-Air web updates:
    // url: 'https://ais-dev-hg5cq7c3yoejkhpelewkml-619579931770.asia-southeast1.run.app',
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#1A73E8',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;

