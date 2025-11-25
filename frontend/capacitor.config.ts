import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mpz.app",
  appName: "MPZ App",
  webDir: ".next",
  server: {
    url: "https://mpz.kr",
    cleartext: true, // TODO: 프로덕션 환경에서는 false로 변경
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
    },
  },
};

export default config;
