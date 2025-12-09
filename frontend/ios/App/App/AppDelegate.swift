import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()

        UNUserNotificationCenter.current().delegate = self
        Messaging.messaging().delegate = self

        // 알림 권한 요청 후 등록
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { _, error in
            if let error = error {
                print("알림 권한 요청 에러: \(error)")
            }
            DispatchQueue.main.async {
                application.registerForRemoteNotifications()
            }
        }

        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // APNs 등록 성공 시 FCM에 토큰 연결
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    // APNs 등록 실패
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("APNs 등록 실패: \(error)")
    }

    // FCM 토큰 수신/갱신
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("\n")
        print("========================================")
        print("🔥 FCM 토큰 수신!")
        print("========================================")
        print("\(fcmToken ?? "nil")")
        print("========================================")
        print("👆 이 토큰을 복사해서 Firebase Console에 붙여넣으세요")
        print("========================================")
        print("\n")
        
        // JavaScript로 토큰 전달
        if let token = fcmToken {
            // bridge가 준비될 때까지 여러 번 시도
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                self.sendTokenToJavaScript(token: token, retryCount: 0)
            }
        }
    }
    
    // JavaScript로 토큰 전달 (재시도 로직 포함)
    private func sendTokenToJavaScript(token: String, retryCount: Int) {
        let maxRetries = 30 // 최대 3초 대기 (0.1초 * 30)
        
        guard let bridge = (self.window?.rootViewController as? CAPBridgeViewController)?.bridge else {
            if retryCount < maxRetries {
                if retryCount % 10 == 0 {
                    print("⏳ Bridge 준비 대기 중... (\(retryCount + 1)/\(maxRetries))")
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    self.sendTokenToJavaScript(token: token, retryCount: retryCount + 1)
                }
            } else {
                print("❌ Bridge를 찾을 수 없습니다. 토큰 전달 실패")
            }
            return
        }
        
        // 토큰을 Base64로 인코딩하여 안전하게 전달
        guard let tokenData = token.data(using: .utf8) else {
            print("❌ 토큰 인코딩 실패")
            return
        }
        let base64Token = tokenData.base64EncodedString()
        
        // JavaScript 코드: localStorage 저장 + 이벤트 전달 (분리 실행)
        let saveCode = """
            try {
                var token = atob('\(base64Token)');
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('fcm_token_debug', token);
                    console.log('✅ localStorage에 FCM 토큰 저장 완료');
                }
            } catch(e) {
                console.error('localStorage 저장 실패:', e);
            }
        """
        
        let eventCode = """
            try {
                var token = atob('\(base64Token)');
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    var event = new CustomEvent('fcmToken', { detail: token });
                    window.dispatchEvent(event);
                    console.log('✅ fcmToken 이벤트 전달 완료');
                } else {
                    console.warn('⚠️ window 또는 dispatchEvent가 없습니다');
                }
            } catch(e) {
                console.error('이벤트 전달 실패:', e);
            }
        """
        
        // localStorage 저장 먼저
        bridge.eval(js: saveCode)
        
        // 약간의 지연 후 이벤트 전달 (웹뷰 완전 로드 대기)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            bridge.eval(js: eventCode)
        }
        
        print("✅ FCM 토큰을 JavaScript로 전달 완료 (재시도: \(retryCount)회)")
    }

    // 포그라운드 수신 시 표시 방식
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .list, .sound, .badge])
    }

    // 백그라운드/종료 상태에서 알림 탭 시 처리
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        completionHandler()
    }

    // data-only 메시지 수신 처리
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        Messaging.messaging().appDidReceiveMessage(userInfo)
        completionHandler(.newData)
    }
}
