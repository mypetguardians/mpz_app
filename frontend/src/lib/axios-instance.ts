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
    if (typeof window !== "undefined") {
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
    if (typeof window !== "undefined") {
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
  (error: AxiosError) => {
    if (typeof window !== "undefined") {
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
