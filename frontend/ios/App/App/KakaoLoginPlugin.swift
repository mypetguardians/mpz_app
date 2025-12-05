import Foundation
import Capacitor
import KakaoSDKAuth
import KakaoSDKUser
import KakaoSDKCommon

@objc(KakaoLoginPlugin)
public class KakaoLoginPlugin: CAPPlugin {
    
    @objc func initialize(_ call: CAPPluginCall) {
        print("🔵 [KakaoLoginPlugin] initialize() 메서드 호출됨")
        guard let appKey = call.getString("appKey") else {
            print("❌ [KakaoLoginPlugin] appKey가 없음")
            call.reject("appKey가 필요합니다.")
            return
        }
        
        print("🔵 [KakaoLoginPlugin] KakaoSDK 초기화 중... appKey: \(appKey.prefix(10))...")
        KakaoSDK.initSDK(appKey: appKey)
        print("✅ [KakaoLoginPlugin] KakaoSDK 초기화 완료")
        call.resolve()
    }
    
    @objc func login(_ call: CAPPluginCall) {
        // iOS 네이티브 로그인 플로우
        // 웹뷰를 사용하지 않고 카카오톡 앱 또는 Safari(ASWebAuthenticationSession) 사용
        print("🔵 [KakaoLoginPlugin] login() 메서드 호출됨")
        
        if AuthApi.hasToken() {
            print("🔵 [KakaoLoginPlugin] 기존 토큰이 있음, 토큰 유효성 확인 중...")
            UserApi.shared.accessTokenInfo { (_, error) in
                if let error = error {
                    if let sdkError = error as? SdkError, sdkError.isInvalidTokenError() == true {
                        // 토큰이 유효하지 않으면 재로그인
                        self.loginWithKakaoTalk(call: call)
                    } else {
                        call.reject("토큰 정보 조회 실패: \(error.localizedDescription)")
                    }
                } else {
                    // 토큰이 유효하면 기존 토큰 사용
                    self.getAccessToken(call: call)
                }
            }
        } else {
            // 토큰이 없으면 로그인
            loginWithKakaoTalk(call: call)
        }
    }
    
    private func loginWithKakaoTalk(call: CAPPluginCall) {
        // ⚠️ 중요: iOS 네이티브 앱에서는 웹뷰(WKWebView, SFSafariViewController) 사용 금지
        // - Apple App Store 심사 정책 위반 가능성
        // - 보안 문제 (피싱 위험)
        // - 카카오 정책상 권장하지 않음
        // - 사용자 경험 저하
        
        print("🔵 [KakaoLoginPlugin] loginWithKakaoTalk() 호출됨")
        
        // 카카오톡 앱이 설치되어 있는지 확인
        let isKakaoTalkAvailable = UserApi.isKakaoTalkLoginAvailable()
        print("🔵 [KakaoLoginPlugin] 카카오톡 설치 여부: \(isKakaoTalkAvailable)")
        
        if isKakaoTalkAvailable {
            // 1순위: 카카오톡 앱으로 로그인 (앱 간 전환)
            // 가장 권장되는 방식 - 네이티브 앱 간 전환으로 간편하게 로그인
            print("🔵 [KakaoLoginPlugin] 카카오톡 앱으로 로그인 시작")
            UserApi.shared.loginWithKakaoTalk { (oauthToken, error) in
                if let error = error {
                    print("❌ [KakaoLoginPlugin] 카카오톡 로그인 실패: \(error.localizedDescription)")
                    call.reject("카카오톡 로그인 실패: \(error.localizedDescription)")
                } else if let oauthToken = oauthToken {
                    print("✅ [KakaoLoginPlugin] 카카오톡 로그인 성공")
                    self.returnToken(call: call, token: oauthToken)
                }
            }
        } else {
            // 2순위: 카카오 계정으로 로그인
            // Safari 같은 외부 브라우저(ASWebAuthenticationSession) 사용
            // 웹뷰가 아닌 외부 브라우저를 사용하므로 App Store 정책 준수
            // Kakao SDK for iOS가 자동으로 네이티브 방식으로 처리
            print("🔵 [KakaoLoginPlugin] 카카오 계정으로 로그인 시작 (Safari/ASWebAuthenticationSession)")
            UserApi.shared.loginWithKakaoAccount { (oauthToken, error) in
                if let error = error {
                    print("❌ [KakaoLoginPlugin] 카카오 계정 로그인 실패: \(error.localizedDescription)")
                    call.reject("카카오 계정 로그인 실패: \(error.localizedDescription)")
                } else if let oauthToken = oauthToken {
                    print("✅ [KakaoLoginPlugin] 카카오 계정 로그인 성공")
                    self.returnToken(call: call, token: oauthToken)
                }
            }
        }
    }
    
    private func getAccessToken(call: CAPPluginCall) {
        if let token = TokenManager.manager.getToken() {
            returnToken(call: call, token: token)
        } else {
            call.reject("액세스 토큰을 가져올 수 없습니다.")
        }
    }
    
    private func returnToken(call: CAPPluginCall, token: OAuthToken) {
        var ret = JSObject()
        ret["accessToken"] = token.accessToken
        
        // refreshToken은 non-optional String 타입
        if !token.refreshToken.isEmpty {
            ret["refreshToken"] = token.refreshToken
        }
        
        // idToken은 Optional
        if let idToken = token.idToken {
            ret["idToken"] = idToken
        }
        call.resolve(ret)
    }
    
    @objc func logout(_ call: CAPPluginCall) {
        UserApi.shared.logout { (error) in
            if let error = error {
                call.reject("로그아웃 실패: \(error.localizedDescription)")
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func unlink(_ call: CAPPluginCall) {
        UserApi.shared.unlink { (error) in
            if let error = error {
                call.reject("회원탈퇴 실패: \(error.localizedDescription)")
            } else {
                call.resolve()
            }
        }
    }
    
    @objc func getUserInfo(_ call: CAPPluginCall) {
        UserApi.shared.me { (user, error) in
            if let error = error {
                call.reject("사용자 정보 조회 실패: \(error.localizedDescription)")
            } else if let user = user {
                guard let userId = user.id else {
                    call.reject("사용자 ID를 가져올 수 없습니다.")
                    return
                }
                var ret = JSObject()
                ret["id"] = String(userId)
                
                if let kakaoAccount = user.kakaoAccount {
                    ret["email"] = kakaoAccount.email
                    
                    if let profile = kakaoAccount.profile {
                        ret["nickname"] = profile.nickname
                        ret["profileImageUrl"] = profile.profileImageUrl?.absoluteString
                    }
                }
                
                call.resolve(ret)
            }
        }
    }
}

