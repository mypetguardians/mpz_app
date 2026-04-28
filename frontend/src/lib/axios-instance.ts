import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.mpz.kr/v1/";

const IS_PROD = BASE_URL.includes("api.mpz.kr") && !BASE_URL.includes("dev-api");
const IS_DEV = !IS_PROD;

if (typeof window !== "undefined") {
  if (IS_PROD) {
    // 환영 메시지 먼저 출력
    const messages = [
      "오늘도 새 가족을 기다리는 아이들이 있어요 🐶",
      "당신의 작은 관심이 한 생명을 구할 수 있어요 🐾",
      "입양은 사랑의 시작이에요 💛",
      "보호소의 아이들이 당신을 기다리고 있어요 🏠",
      "세상에서 가장 따뜻한 선택, 입양 🤗",
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    console.log(
      `%c
  ╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
  ┃                            ┃
  ┃    ∩＿∩                    ┃
  ┃   (・ᴥ・ )  ＜ 멍!         ┃
  ┃   ⊃    つ                  ┃
  ┃   ∪  ∪                    ┃
  ┃                            ┃
  ┃   M  P  Z  -  마 펫 쯔    ┃
  ┃━━━━━━━━━━━━━━━━━━━━━━━━━━┃
  ┃                            ┃
  ┃   ${randomMsg.padEnd(22)}  ┃
  ┃                            ┃
  ╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`,
      "color:#ff6b35;font-size:13px;font-weight:bold"
    );

    // 환영 메시지 출력 후 모든 console 억제
    const noop = () => {};
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
  } else {
    console.log(`%c[MPZ DEV] API: ${BASE_URL}`, "color:#f59e0b;font-weight:bold");
  }
}

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (IS_DEV && typeof window !== "undefined") {
      const method = (config.method || "GET").toUpperCase();
      const url = `${config.baseURL || ""}${config.url || ""}`;
      console.log(
        `%c[요청] ${method} ${url}`,
        "color:#2563eb;font-weight:bold",
        config.params || config.data || ""
      );
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    if (IS_DEV && typeof window !== "undefined") {
      const method = (response.config.method || "GET").toUpperCase();
      const url = `${response.config.baseURL || ""}${response.config.url || ""}`;
      console.log(
        `%c[응답] ${method} ${url} ${response.status}`,
        "color:#16a34a;font-weight:bold",
        response.data
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 + 아직 재시도 안 한 경우 → refresh token으로 갱신
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("refresh-token") &&
      !originalRequest.url?.includes("login")
    ) {
      originalRequest._retry = true;
      try {
        await instance.post("/auth/refresh-token", {});
        // 쿠키가 자동 갱신되므로 원래 요청 재시도
        return instance(originalRequest);
      } catch {
        // refresh도 실패하면 로그아웃 처리
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:expired"));
        }
        return Promise.reject(error);
      }
    }

    if (IS_DEV && typeof window !== "undefined") {
      const method = (error.config?.method || "GET").toUpperCase();
      const url = `${error.config?.baseURL || ""}${error.config?.url || ""}`;
      console.log(
        `%c[응답 에러] ${method} ${url} ${error.response?.status || "NETWORK"}`,
        "color:#dc2626;font-weight:bold",
        error.response?.data || error.message
      );
    }
    return Promise.reject(error);
  }
);

export default instance;
