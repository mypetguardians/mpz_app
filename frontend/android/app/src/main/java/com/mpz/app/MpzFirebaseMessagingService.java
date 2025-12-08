package com.mpz.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.util.Log;
import androidx.annotation.NonNull;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Firebase Cloud Messaging 서비스
 * 푸시 알림을 받고 FCM 토큰을 관리합니다.
 */
public class MpzFirebaseMessagingService extends FirebaseMessagingService {
    
    private static final String TAG = "MpzFCMService";
    private static final String CHANNEL_ID = "mpz_default_channel";
    private static final String CHANNEL_NAME = "MPZ 알림";
    private static final String CHANNEL_DESCRIPTION = "마펫쯔 앱의 기본 알림 채널입니다.";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    /**
     * FCM 토큰이 생성되거나 갱신될 때 호출됩니다.
     * 이 토큰을 백엔드 서버로 전송해야 합니다.
     */
    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "새로운 FCM 토큰: " + token);
        
        // TODO: 백엔드 서버로 토큰 전송
        // 예: sendTokenToServer(token);
        
        // Capacitor 플러그인을 통해 JavaScript로 토큰 전달
        sendTokenToCapacitor(token);
    }

    /**
     * 푸시 알림을 받았을 때 호출됩니다.
     */
    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "푸시 알림 수신");
        Log.d(TAG, "From: " + remoteMessage.getFrom());
        
        // 알림 데이터 확인
        if (remoteMessage.getNotification() != null) {
            String title = remoteMessage.getNotification().getTitle();
            String body = remoteMessage.getNotification().getBody();
            Log.d(TAG, "알림 제목: " + title);
            Log.d(TAG, "알림 내용: " + body);
        }
        
        // 커스텀 데이터 확인
        Map<String, String> data = remoteMessage.getData();
        if (data.size() > 0) {
            Log.d(TAG, "커스텀 데이터: " + data);
        }
        
        // TODO: 알림 표시 또는 Capacitor로 전달
        // 예: showNotification(remoteMessage);
        sendMessageToCapacitor(remoteMessage);
    }

    /**
     * 알림 채널 생성 (Android 8.0 이상 필수)
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription(CHANNEL_DESCRIPTION);
            channel.enableLights(true);
            channel.enableVibration(true);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
                Log.d(TAG, "알림 채널 생성 완료: " + CHANNEL_ID);
            }
        }
    }

    /**
     * FCM 토큰을 Capacitor로 전달
     * JavaScript에서 이 토큰을 받아 백엔드로 전송할 수 있습니다.
     */
    private void sendTokenToCapacitor(String token) {
        // Capacitor 플러그인을 통해 JavaScript로 토큰 전달
        // 이 부분은 Capacitor Push Notifications 플러그인을 사용하거나
        // 커스텀 플러그인을 만들어서 구현할 수 있습니다.
        Log.d(TAG, "토큰을 Capacitor로 전달: " + token);
        
        // TODO: Capacitor 플러그인을 통해 JavaScript로 이벤트 전송
        // 예: Bridge.getInstance().triggerJSEvent("fcmTokenReceived", "{token: '" + token + "'}");
    }

    /**
     * 푸시 알림 메시지를 Capacitor로 전달
     */
    private void sendMessageToCapacitor(RemoteMessage remoteMessage) {
        Log.d(TAG, "푸시 알림을 Capacitor로 전달");
        
        // TODO: Capacitor 플러그인을 통해 JavaScript로 이벤트 전송
        // 예: Bridge.getInstance().triggerJSEvent("pushNotificationReceived", messageData);
    }
}
