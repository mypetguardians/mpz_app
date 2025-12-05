import Foundation
import Capacitor
import KakaoSDKAuth
import KakaoSDKUser
import KakaoSDKCommon

@objc(KakaoLoginPlugin)
public class KakaoLoginPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KakaoLoginPlugin"
    public let jsName = "KakaoLogin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "login", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logout", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unlink", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getUserInfo", returnType: CAPPluginReturnPromise)
    ]
    
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
        print("🔵 [KakaoLoginPlugin] login() 메서드 호출됨")
        
        // 기존 토큰이 있는지 확인
        if AuthApi.hasToken() {
            print("🔵 [KakaoLoginPlugin] 기존 토큰이 있음, 토큰 유효성 확인 중...")
            UserApi.shared.accessTokenInfo { (_, error) in
                if let error = error {
                    if let sdkError = error as? SdkError, sdkError.isInvalidTokenError() == true {
                        // 토큰이 유효하지 않으면 재로그인
                        print("⚠️ [KakaoLoginPlugin] 토큰이 유효하지 않음, 재로그인 필요")
                        self.performLogin(call: call)
                    } else {
                        print("❌ [KakaoLoginPlugin] 토큰 정보 조회 실패: \(error.localizedDescription)")
                        call.reject("토큰 정보 조회 실패: \(error.localizedDescription)")
                    }
                } else {
                    // 토큰이 유효하면 기존 토큰 반환
                    print("✅ [KakaoLoginPlugin] 기존 토큰이 유효함")
                    self.getAccessToken(call: call)
                }
            }
        } else {
            // 토큰이 없으면 로그인
            print("ℹ️ [KakaoLoginPlugin] 기존 토큰이 없음, 로그인 시작")
            performLogin(call: call)
        }
    }
    
    // MARK: - Login Implementation
    // 카카오 로그인 구현
    // 카카오 개발자 문서: https://developers.kakao.com/docs/latest/ko/kakaologin/ios
    //
    // 로그인 순서:
    // 1. 카카오톡 앱 설치 여부 확인: UserApi.isKakaoTalkLoginAvailable()
    // 2. 설치되어 있으면: UserApi.shared.loginWithKakaoTalk() - 카카오톡 앱으로 로그인
    // 3. 설치되어 있지 않으면: UserApi.shared.loginWithKakaoAccount() - Safari/ASWebAuthenticationSession 사용
    //
    // ⚠️ 중요: iOS 네이티브 앱에서는 웹뷰 사용 금지
    // - Apple App Store 심사 정책 위반 가능성
    // - 보안 문제 (피싱 위험)
    // - 카카오 정책상 권장하지 않음
    private func performLogin(call: CAPPluginCall) {
        print("🔵 [KakaoLoginPlugin] performLogin() 시작")
        
        // 카카오톡 앱 설치 여부 확인
        let isKakaoTalkAvailable = UserApi.isKakaoTalkLoginAvailable()
        print("🔵 [KakaoLoginPlugin] 카카오톡 설치 여부: \(isKakaoTalkAvailable)")
        
        if isKakaoTalkAvailable {
            // 카카오톡 앱으로 로그인
            loginWithKakaoTalk(call: call)
        } else {
            // 카카오 계정으로 로그인 (Safari/ASWebAuthenticationSession 사용)
            loginWithKakaoAccount(call: call)
        }
    }
    
    // MARK: - KakaoTalk Login
    // 카카오톡 앱으로 로그인
    // 카카오톡 앱이 열리고, 인증 후 kakao{NATIVE_APP_KEY}://oauth URL로 돌아옴
    // AppDelegate/SceneDelegate의 URL 처리 메서드가 이를 감지하고 처리
    private func loginWithKakaoTalk(call: CAPPluginCall) {
        print("🔵 [KakaoLoginPlugin] loginWithKakaoTalk() 호출됨")
        
        UserApi.shared.loginWithKakaoTalk { (oauthToken, error) in
            if let error = error {
                print("❌ [KakaoLoginPlugin] 카카오톡 로그인 실패: \(error.localizedDescription)")
                if let sdkError = error as? SdkError {
                    print("❌ [KakaoLoginPlugin] SDK 에러 상세: \(sdkError)")
                }
                call.reject("카카오톡 로그인 실패: \(error.localizedDescription)")
            } else if let oauthToken = oauthToken {
                print("✅ [KakaoLoginPlugin] 카카오톡 로그인 성공")
                self.returnToken(call: call, token: oauthToken)
            } else {
                print("⚠️ [KakaoLoginPlugin] 카카오톡 로그인 결과가 nil입니다")
                call.reject("카카오톡 로그인 결과를 받을 수 없습니다.")
            }
        }
    }
    
    // MARK: - KakaoAccount Login
    // 카카오 계정으로 로그인
    // Safari 같은 외부 브라우저(ASWebAuthenticationSession) 사용
    // 웹뷰가 아닌 외부 브라우저를 사용하므로 App Store 정책 준수
    private func loginWithKakaoAccount(call: CAPPluginCall) {
        print("🔵 [KakaoLoginPlugin] loginWithKakaoAccount() 호출됨")
        
        UserApi.shared.loginWithKakaoAccount { (oauthToken, error) in
            if let error = error {
                print("❌ [KakaoLoginPlugin] 카카오 계정 로그인 실패: \(error.localizedDescription)")
                if let sdkError = error as? SdkError {
                    print("❌ [KakaoLoginPlugin] SDK 에러 상세: \(sdkError)")
                }
                call.reject("카카오 계정 로그인 실패: \(error.localizedDescription)")
            } else if let oauthToken = oauthToken {
                print("✅ [KakaoLoginPlugin] 카카오 계정 로그인 성공")
                self.returnToken(call: call, token: oauthToken)
            } else {
                print("⚠️ [KakaoLoginPlugin] 카카오 계정 로그인 결과가 nil입니다")
                call.reject("카카오 계정 로그인 결과를 받을 수 없습니다.")
            }
        }
    }
    
    // MARK: - Token Management
    private func getAccessToken(call: CAPPluginCall) {
        if let token = TokenManager.manager.getToken() {
            returnToken(call: call, token: token)
        } else {
            print("❌ [KakaoLoginPlugin] 토큰을 가져올 수 없음")
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
        
        print("✅ [KakaoLoginPlugin] 토큰 반환 완료 (accessToken 존재: \(!token.accessToken.isEmpty))")
        call.resolve(ret)
    }
    
    // MARK: - Logout
    @objc func logout(_ call: CAPPluginCall) {
        print("🔵 [KakaoLoginPlugin] logout() 호출됨")
        
        UserApi.shared.logout { (error) in
            if let error = error {
                print("❌ [KakaoLoginPlugin] 로그아웃 실패: \(error.localizedDescription)")
                call.reject("로그아웃 실패: \(error.localizedDescription)")
            } else {
                print("✅ [KakaoLoginPlugin] 로그아웃 성공")
                call.resolve()
            }
        }
    }
    
    // MARK: - Unlink
    // 연결 해제 (회원탈퇴)
    @objc func unlink(_ call: CAPPluginCall) {
        print("🔵 [KakaoLoginPlugin] unlink() 호출됨")
        
        UserApi.shared.unlink { (error) in
            if let error = error {
                print("❌ [KakaoLoginPlugin] 연결 해제 실패: \(error.localizedDescription)")
                call.reject("회원탈퇴 실패: \(error.localizedDescription)")
            } else {
                print("✅ [KakaoLoginPlugin] 연결 해제 성공")
                call.resolve()
            }
        }
    }
    
    // MARK: - Get User Info
    @objc func getUserInfo(_ call: CAPPluginCall) {
        print("🔵 [KakaoLoginPlugin] getUserInfo() 호출됨")
        
        UserApi.shared.me { (user, error) in
            if let error = error {
                print("❌ [KakaoLoginPlugin] 사용자 정보 조회 실패: \(error.localizedDescription)")
                call.reject("사용자 정보 조회 실패: \(error.localizedDescription)")
            } else if let user = user {
                guard let userId = user.id else {
                    print("❌ [KakaoLoginPlugin] 사용자 ID를 가져올 수 없음")
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
                
                print("✅ [KakaoLoginPlugin] 사용자 정보 조회 성공 (ID: \(userId))")
                call.resolve(ret)
            } else {
                print("⚠️ [KakaoLoginPlugin] 사용자 정보가 nil입니다")
                call.reject("사용자 정보를 가져올 수 없습니다.")
            }
        }
    }
}