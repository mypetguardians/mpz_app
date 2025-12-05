import Foundation
import Capacitor
import KakaoSDKCommon
import KakaoSDKAuth
import KakaoSDKUser

@objc(KakaoLoginPlugin)
public class KakaoLoginPlugin: CAPPlugin {

    // 로그인 메서드 노출
    @objc func login(_ call: CAPPluginCall) {

        // 카카오톡 설치 여부에 따라 로그인 분기
        if (UserApi.isKakaoTalkLoginAvailable()) {

            // 카카오톡으로 로그인
            UserApi.shared.loginWithKakaoTalk { (oauthToken, error) in
                if let error = error {
                    call.reject("KakaoTalk login failed: \(error.localizedDescription)")
                } else if let token = oauthToken {
                    call.resolve([
                        "accessToken": token.accessToken,
                        "refreshToken": token.refreshToken ?? ""
                    ])
                } else {
                    call.reject("KakaoTalk login returned no token")
                }
            }

        } else {

            // 카카오 계정 로그인
            UserApi.shared.loginWithKakaoAccount { (oauthToken, error) in
                if let error = error {
                    call.reject("KakaoAccount login failed: \(error.localizedDescription)")
                } else if let token = oauthToken {
                    call.resolve([
                        "accessToken": token.accessToken,
                        "refreshToken": token.refreshToken ?? ""
                    ])
                } else {
                    call.reject("KakaoAccount login returned no token")
                }
            }
        }
    }
}
