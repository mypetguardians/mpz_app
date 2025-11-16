import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mpz.app',
  appName: 'MPZ App',
  webDir: '.next',  // Next.js 빌드 디렉토리
  server: {
    url: 'http://localhost:3000',  // 개발 서버 URL
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      webSpinnerStyle: "horizontal",
    }
  }
};

export default config;
