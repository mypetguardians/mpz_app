import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.mpz.kr/v1/";
//const BASE_URL = "http://127.0.0.1:8000/v1/";

const IS_DEV = BASE_URL.includes("dev-api");

if (typeof window !== "undefined") {
  const env = IS_DEV ? "DEV" : "PROD";
  const color = IS_DEV ? "#f59e0b" : "#3e93fa";
  console.log(`%c[MPZ ${env}] API: ${BASE_URL}`, `color:${color};font-weight:bold`);
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
