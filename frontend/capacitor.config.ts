import { CapacitorConfig } from "@capacitor/cli";

const defaultServerUrl =
  process.env.NODE_ENV === "development"
    ? "http://10.0.2.2:3000"
    : "https://mpz.kr";
const serverUrl = process.env.CAPACITOR_SERVER_URL ?? defaultServerUrl;
const serverUsesHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.mpzapp.app",
  appName: "MPZ",
  // SSR 빌드를 그대로 활용하므로 `.next` 산출물을 Capacitor에 전달
  webDir: ".next",
  server: {
    url: serverUrl,
    cleartext:
      process.env.CAPACITOR_SERVER_CLEAR_TEXT === "true" || serverUsesHttp,
    androidScheme: serverUsesHttp ? "http" : "https",
    allowNavigation: ["openapi.animal.go.kr", "localhost"],
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    scheme: "mpz",
    contentInset: "never",
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
      fullscreen: false,
    },
    // KakaoLogin (Capacitor plugin)
    KakaoLoginPlugin: {
      appKey: process.env.KAKAO_NATIVE_APP_KEY || "",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: false,
    },
    StatusBar: {
      backgroundColor: "#ffffffff",
      style: "dark",
      overlaysWebView: false,
    },
  },
};

export default config;
