import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mpz.app",
  appName: "MPZ App",
  webDir: ".next", // Next.js 빌드 디렉토리
  // 배포 환경: 외부 호스트(mpz.kr)로 접속
  server: {
    url: "https://mpz.kr",
    cleartext: false,
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
