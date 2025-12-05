import { registerPlugin } from "@capacitor/core";

export interface KakaoNativeLoginResult {
  accessToken: string;
  refreshToken?: string;
}

export interface KakaoNativeLoginPlugin {
  initialize(options: { appKey: string }): Promise<void>;
  login(): Promise<KakaoNativeLoginResult>;
}

export const KakaoNativeLogin =
  registerPlugin<KakaoNativeLoginPlugin>("KakaoLogin");
