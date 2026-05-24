import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.x4ortinx.app',
  appName: '4ortin-X:Crypto Bitcoin Wallet',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#0D1117',
  },
};

export default config;
