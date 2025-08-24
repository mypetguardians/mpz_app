export interface AppConfig {
  env: "local" | "test" | "dev" | "prod";
  nodeEnv: "development" | "test" | "production";
  database: {
    type: "sqlite" | "d1";
    path?: string;
    id?: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  kakao: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  cors: {
    origin: string | string[];
  };
  rateLimit: {
    max: number;
    windowMs: number;
  };
  monitoring: {
    enabled: boolean;
    intervalDays: number;
  };
  logLevel: "debug" | "info" | "warn" | "error";
  testing: {
    enabled: boolean;
    mockExternalApis: boolean;
    fastMode: boolean;
  };
}

// 환경별 기본 설정
const baseConfig: Partial<AppConfig> = {
  jwt: {
    secret: process.env.JWT_SECRET || "mpz-default-secret-change-in-production",
    expiresIn: "24h",
  },
  kakao: {
    clientId: process.env.KAKAO_CLIENT_ID || "0ac4fb684d8e1e469976ec2b35f73857",
    clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
    redirectUri: process.env.KAKAO_REDIRECT_URI || "",
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"),
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === "true",
    intervalDays: parseInt(process.env.MONITORING_INTERVAL || "14"),
  },
  logLevel: (process.env.LOG_LEVEL as AppConfig["logLevel"]) || "info",
};

// 로컬 개발 환경
const localConfig: AppConfig = {
  ...baseConfig,
  env: "local",
  nodeEnv: "development",
  database: {
    type: "sqlite",
    path: "./sqlite.db",
  },
  api: {
    baseUrl: "http://localhost:3000",
    timeout: 30000,
  },
  kakao: {
    ...baseConfig.kakao!,
    redirectUri: "http://localhost:3000/api/auth/kakao/callback",
  },
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  },
  rateLimit: {
    max: 1000, // 로컬에서는 넉넉하게
    windowMs: 60000,
  },
  logLevel: "debug",
  testing: {
    enabled: false,
    mockExternalApis: false,
    fastMode: false,
  },
} as AppConfig;

// 테스트 환경
const testConfig: AppConfig = {
  ...baseConfig,
  env: "test",
  nodeEnv: "test",
  database: {
    type: "sqlite",
    path: "./test.db",
  },
  api: {
    baseUrl: "http://localhost:3001",
    timeout: 5000, // 테스트에서는 빠르게
  },
  jwt: {
    secret: "test-jwt-secret-key-for-testing-only",
    expiresIn: "1h", // 테스트용은 짧게
  },
  kakao: {
    clientId: "test-kakao-client-id",
    clientSecret: "test-kakao-client-secret",
    redirectUri: "http://localhost:3001/api/auth/kakao/callback",
  },
  cors: {
    origin: ["http://localhost:3001"],
  },
  rateLimit: {
    max: 10000, // 테스트에서는 제한 없이
    windowMs: 1000,
  },
  monitoring: {
    enabled: false, // 테스트에서는 모니터링 비활성화
    intervalDays: 1,
  },
  logLevel: "warn", // 테스트 로그는 최소화
  testing: {
    enabled: true,
    mockExternalApis: true, // 외부 API 모킹
    fastMode: true, // 빠른 테스트 모드
  },
} as AppConfig;

// 개발 서버 환경 (Cloudflare Workers)
const devConfig: AppConfig = {
  ...baseConfig,
  env: "dev",
  nodeEnv: "development",
  database: {
    type: "d1",
    id: process.env.DEV_DATABASE_ID || "88198d53-9b61-4260-a200-2f30c9873335",
  },
  api: {
    baseUrl: "https://mpz-dev.conscience.workers.dev",
    timeout: 30000,
  },
  kakao: {
    ...baseConfig.kakao!,
    redirectUri:
      "https://mpz-dev.conscience.workers.dev/api/auth/kakao/callback",
  },
  cors: {
    origin: ["https://mpz-dev.conscience.workers.dev", "http://localhost:3000"],
  },
  logLevel: "debug",
  testing: {
    enabled: false,
    mockExternalApis: false,
    fastMode: false,
  },
} as AppConfig;

// 프로덕션 환경 (Django Backend)
const prodConfig: AppConfig = {
  ...baseConfig,
  env: "prod",
  nodeEnv: "production",
  database: {
    type: "d1",
    id: process.env.PROD_DATABASE_ID || "need-to-create-prod-database-id",
  },
  api: {
    baseUrl:
      process.env.NEXT_PUBLIC_API_URL ||
      "https://mpzfullstack-production.up.railway.app",
    timeout: 15000, // 프로덕션에서는 더 빠르게
  },
  kakao: {
    ...baseConfig.kakao!,
    redirectUri: process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/kakao/callback`
      : "https://mpzfullstack-production.up.railway.app/api/auth/kakao/callback",
  },
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_API_URL ||
        "https://mpzfullstack-production.up.railway.app",
    ],
  },
  rateLimit: {
    max: 50, // 프로덕션에서는 더 엄격하게
    windowMs: 60000,
  },
  logLevel: "warn",
  testing: {
    enabled: false,
    mockExternalApis: false,
    fastMode: false,
  },
} as AppConfig;

// 환경 감지 및 설정 반환
function getConfig(): AppConfig {
  const appEnv = process.env.APP_ENV;
  const nodeEnv = process.env.NODE_ENV;

  // APP_ENV가 명시적으로 설정된 경우
  if (appEnv === "local") return localConfig;
  if (appEnv === "test") return testConfig;
  if (appEnv === "dev") return devConfig;
  if (appEnv === "prod") return prodConfig;

  // NODE_ENV 기반 자동 감지
  if (nodeEnv === "test") {
    return testConfig;
  }

  if (nodeEnv === "development") {
    // 로컬인지 Workers dev인지 구분
    if (typeof process !== "undefined" && process.env.CLOUDFLARE_ACCOUNT_ID) {
      return devConfig;
    }
    return localConfig;
  }

  if (nodeEnv === "production") {
    return prodConfig;
  }

  // 기본값은 로컬
  return localConfig;
}

export const config = getConfig();

// 설정 검증
export function validateConfig(cfg: AppConfig): void {
  if (
    !cfg.jwt.secret ||
    cfg.jwt.secret === "mpz-default-secret-change-in-production"
  ) {
    if (cfg.env === "prod") {
      throw new Error("JWT_SECRET must be set in production");
    }
    if (cfg.env !== "test") {
      console.warn(
        "⚠️ Using default JWT secret. Set JWT_SECRET in production!"
      );
    }
  }

  if (!cfg.kakao.clientId) {
    if (cfg.env !== "test") {
      throw new Error("KAKAO_CLIENT_ID is required");
    }
  }

  if (cfg.env === "prod" && !cfg.kakao.clientSecret) {
    throw new Error("KAKAO_CLIENT_SECRET must be set in production");
  }

  if (cfg.env !== "test") {
    console.log(`🚀 MPZ API starting in ${cfg.env.toUpperCase()} environment`);
    console.log(`📍 API URL: ${cfg.api.baseUrl}`);
    console.log(`🗄️ Database: ${cfg.database.type.toUpperCase()}`);
    console.log(`📊 Log Level: ${cfg.logLevel.toUpperCase()}`);
    if (cfg.testing.enabled) {
      console.log(
        `🧪 Testing Mode: ${cfg.testing.fastMode ? "FAST" : "NORMAL"}`
      );
    }
  }
}
