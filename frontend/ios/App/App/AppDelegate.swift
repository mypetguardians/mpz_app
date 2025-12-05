import UIKit
import Capacitor
import KakaoSDKCommon
import KakaoSDKAuth

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        // 카카오 SDK 초기화
        KakaoSDK.initSDK(appKey: "30c65f4b266ed8e462b30c91518d174b")
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused while the application was inactive.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate.
    }

    // MARK: - URL Handling for Kakao Login
    // 카카오톡 앱에서 인증 후 돌아올 때 호출되는 메서드
    // 카카오 개발자 문서: https://developers.kakao.com/docs/latest/ko/kakaologin/ios
    //
    // Info.plist의 URL Schemes (kakao{NATIVE_APP_KEY})를 통해 앱이 열림
    // 예: kakao30c65f4b266ed8e462b30c91518d174b://oauth
    //
    // 카카오톡으로 로그인 시:
    // 1. UserApi.shared.loginWithKakaoTalk() 호출
    // 2. 카카오톡 앱이 열림
    // 3. 사용자가 동의하고 계속하기 선택
    // 4. kakao{NATIVE_APP_KEY}://oauth URL로 앱이 다시 열림
    // 5. 이 메서드가 호출되어 URL 처리
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        print("🔵 [AppDelegate] URL 열기 요청: \(url.absoluteString)")
        
        // 카카오 로그인 URL 처리 (카카오톡 앱에서 돌아올 때)
        // AuthApi.isKakaoTalkLoginUrl()은 kakao{NATIVE_APP_KEY}://oauth 형식의 URL을 확인
        if AuthApi.isKakaoTalkLoginUrl(url) {
            print("✅ [AppDelegate] 카카오 로그인 URL 감지, AuthController로 전달")
            let handled = AuthController.handleOpenUrl(url: url)
            if handled {
                print("✅ [AppDelegate] 카카오 로그인 URL 처리 완료")
            } else {
                print("⚠️ [AppDelegate] 카카오 로그인 URL 처리 실패")
            }
            return handled
        }
        
        // 다른 URL은 Capacitor의 기본 처리로 전달
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    // MARK: - Universal Links Support
    // Universal Links를 사용하는 경우 처리
    // 카카오 로그인에서는 일반적으로 필요하지 않지만, 다른 기능에서 사용할 수 있음
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}