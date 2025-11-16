import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

//const BASE_URL = "https://api.mpz.kr/v1/";
const BASE_URL = "http://127.0.0.1:8000/v1/";

// 디버깅: 환경 변수 확인 (개발 환경에서만)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔍 API Base URL:", BASE_URL);
  console.log("🔍 Raw env value:", process.env.NEXT_PUBLIC_API_BASE_URL);
}

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export default instance;
