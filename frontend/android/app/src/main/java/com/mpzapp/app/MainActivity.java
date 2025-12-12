package com.mpzapp.app;

import android.graphics.Color;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import androidx.core.app.ActivityCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;
import androidx.annotation.NonNull;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends BridgeActivity {
    private Runnable lightInsetsRunnable;
    private final AtomicBoolean safeAreaInsetsInitialized = new AtomicBoolean(false);
    private int lastSafeTop = -1;
    private int lastSafeBottom = -1;
    private int lastSafeLeft = -1;
    private int lastSafeRight = -1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(KakaoLoginPlugin.class);
        super.onCreate(savedInstanceState);

        // 시스템 바 영역까지 앱이 그리지 않도록 설정하여 상단 안전 영역이 흰색으로 채워지게 함
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        // 상태바/내비게이션 바를 흰색으로 채워 노치 영역이 투명하게 보이지 않도록 처리
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().setNavigationBarColor(Color.WHITE);

        // Android 13+ 알림 권한 요청
        requestNotificationPermissionIfNeeded();

        lightInsetsRunnable = () -> {
            WindowInsetsControllerCompat insetsController =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (insetsController != null) {
                insetsController.setAppearanceLightStatusBars(true);
                insetsController.setAppearanceLightNavigationBars(true);
            }
        };

        // Safe area insets 계산 및 JavaScript로 전달
        setupSafeAreaInsets();
        
        // FCM 토큰 가져오기
        getFCMToken();
    }

    private void requestNotificationPermissionIfNeeded() {
        if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.TIRAMISU) {
            return;
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                1001
            );
        }
    }
    
    /**
     * Safe area insets를 계산하고 JavaScript로 전달
     */
    private void setupSafeAreaInsets() {
        View decorView = getWindow().getDecorView();
        decorView.setOnApplyWindowInsetsListener((v, insets) -> {
            WindowInsetsCompat windowInsets = WindowInsetsCompat.toWindowInsetsCompat(insets);
            
            int top = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            int bottom = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            int left = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()).left;
            int right = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()).right;
            
            // JavaScript로 safe area insets 전달 (즉시 실행)
            sendSafeAreaInsetsToJavaScript(top, bottom, left, right);
            
            return insets;
        });
        
        // 초기 insets 계산 (WebView가 준비될 때까지 약간 지연)
        decorView.post(() -> {
            // Bridge가 준비될 때까지 재시도
            if (getBridge() == null || getBridge().getWebView() == null) {
                decorView.postDelayed(() -> {
                    WindowInsetsCompat windowInsets = WindowInsetsCompat.toWindowInsetsCompat(
                        decorView.getRootWindowInsets()
                    );
                    if (windowInsets != null) {
                        int top = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
                        int bottom = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                        int left = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()).left;
                        int right = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()).right;
                        
                        sendSafeAreaInsetsToJavaScript(top, bottom, left, right);
                    }
                }, 100);
            } else {
                WindowInsetsCompat windowInsets = WindowInsetsCompat.toWindowInsetsCompat(
                    decorView.getRootWindowInsets()
                );
                if (windowInsets != null) {
                    int top = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
                    int bottom = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                    int left = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()).left;
                    int right = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()).right;
                    
                    sendSafeAreaInsetsToJavaScript(top, bottom, left, right);
                }
            }
        });
    }
    
    /**
     * Safe area insets를 JavaScript로 전달
     */
    private void sendSafeAreaInsetsToJavaScript(int top, int bottom, int left, int right) {
        // 값이 이전과 동일하면 재계산/재전달 생략
        if (top == lastSafeTop && bottom == lastSafeBottom && left == lastSafeLeft && right == lastSafeRight) {
            return;
        }
        lastSafeTop = top;
        lastSafeBottom = bottom;
        lastSafeLeft = left;
        lastSafeRight = right;

        // Bridge가 준비될 때까지 재시도
        if (getBridge() == null || getBridge().getWebView() == null) {
            // Bridge가 아직 준비되지 않았으면 100ms 후 재시도
            getWindow().getDecorView().postDelayed(() -> {
                sendSafeAreaInsetsToJavaScript(top, bottom, left, right);
            }, 100);
            return;
        }
        
        try {
            String script = String.format(
                "(function() {" +
                "  if (typeof window !== 'undefined' && document && document.documentElement) {" +
                "    document.documentElement.style.setProperty('--safe-area-top', '%dpx', 'important');" +
                "    document.documentElement.style.setProperty('--safe-area-bottom', '%dpx', 'important');" +
                "    document.documentElement.style.setProperty('--safe-area-left', '%dpx', 'important');" +
                "    document.documentElement.style.setProperty('--safe-area-right', '%dpx', 'important');" +
                "    var event = new CustomEvent('safeAreaInsetsChanged', { " +
                "      detail: { top: %d, bottom: %d, left: %d, right: %d }" +
                "    });" +
                "    window.dispatchEvent(event);" +
                "  }" +
                "})();",
                top, bottom, left, right, top, bottom, left, right
            );
            getBridge().eval(script, null);
            Log.d("MainActivity", String.format("Safe area insets 전달 성공: top=%d, bottom=%d, left=%d, right=%d", top, bottom, left, right));
        } catch (Exception e) {
            Log.e("MainActivity", "Safe area insets 전달 실패", e);
            // 실패 시 재시도
            getWindow().getDecorView().postDelayed(() -> {
                sendSafeAreaInsetsToJavaScript(top, bottom, left, right);
            }, 200);
        }
    }
    
    /**
     * FCM 토큰을 가져와서 JavaScript로 전달
     */
    private void getFCMToken() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(new OnCompleteListener<String>() {
                @Override
                public void onComplete(@NonNull Task<String> task) {
                    if (!task.isSuccessful()) {
                        Log.w("MainActivity", "FCM 토큰 가져오기 실패", task.getException());
                        return;
                    }

                    // FCM 토큰 가져오기 성공
                    String token = task.getResult();
                    Log.d("MainActivity", "\n========================================");
                    Log.d("MainActivity", "🔥 FCM 토큰 수신!");
                    Log.d("MainActivity", "========================================");
                    Log.d("MainActivity", token);
                    Log.d("MainActivity", "========================================");
                    Log.d("MainActivity", "👆 이 토큰을 복사해서 Firebase Console에 붙여넣으세요");
                    Log.d("MainActivity", "========================================\n");
                    
                    // JavaScript로 토큰 전달
                    sendTokenToJavaScript(token);
                }
            });
    }
    
    /**
     * FCM 토큰을 JavaScript로 전달
     * JavaScript에서 window.addEventListener('fcmToken', ...)로 받을 수 있습니다.
     */
    private void sendTokenToJavaScript(String token) {
        if (getBridge() != null) {
            getBridge().eval("window.dispatchEvent(new CustomEvent('fcmToken', { detail: '" + token + "' }));", null);
            Log.d("MainActivity", "FCM 토큰을 JavaScript로 전달 완료");
        }
    }

    private void renderSafeAreaInsetsIfInitialized() {
        if (!safeAreaInsetsInitialized.get() || lightInsetsRunnable == null) {
            return;
        }

        runOnUiThread(() -> {
            lightInsetsRunnable.run();
            getWindow().getDecorView().post(lightInsetsRunnable);
        });
    }

    // 플러그인에서 안전 영역 값이 준비되면 호출
    public void notifySafeAreaInsetsInitialized() {
        safeAreaInsetsInitialized.set(true);
        renderSafeAreaInsetsIfInitialized();
    }
    
    @Override
    public void onStart() {
        super.onStart();
        // onStart에서는 setupSafeAreaInsets를 호출하지 않음
        // setupSafeAreaInsets는 onCreate에서만 호출하여 리스너 중복 등록 방지
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // 앱이 재개될 때 safe area insets 다시 계산 (값만 업데이트, 리스너는 재등록하지 않음)
        View decorView = getWindow().getDecorView();
        decorView.post(() -> {
            WindowInsetsCompat windowInsets = WindowInsetsCompat.toWindowInsetsCompat(
                decorView.getRootWindowInsets()
            );
            if (windowInsets != null) {
                int top = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
                int bottom = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                int left = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()).left;
                int right = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()).right;
                
                // 비정상적으로 큰 값 방지 (일반적으로 100px 이하)
                if (top > 100) {
                    Log.w("MainActivity", "비정상적인 safe area top 값 감지: " + top + "px, 0으로 설정");
                    top = 0;
                }
                if (bottom > 100) {
                    Log.w("MainActivity", "비정상적인 safe area bottom 값 감지: " + bottom + "px, 0으로 설정");
                    bottom = 0;
                }
                
                sendSafeAreaInsetsToJavaScript(top, bottom, left, right);
            }
        });
    }
}
