package com.mpz.app;

import android.app.Application;
import com.kakao.sdk.common.KakaoSdk;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        KakaoSdk.init(this, "30c65f4b266ed8e462b30c91518d174b");
    }
}

