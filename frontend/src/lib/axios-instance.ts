import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { safeGetItem } from "./storage-utils";

const BASE_URL = "https://mpzfullstack-production.up.railway.app/v1/";

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 쿠키 자동 전송을 위해 true로 변경
});

// header - iOS Safari 호환성을 위한 안전한 토큰 접근
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 안전한 토큰 가져오기 (localStorage 우선, 실패 시 쿠키)
    const accessToken =
      safeGetItem("access_token") || Cookies.get("access_token");
    console.log(
      "🔍 axios 인터셉터 실행됨 - 토큰 확인:",
      accessToken
        ? `토큰 있음: ${accessToken.substring(0, 10)}...`
        : "토큰 없음",
      "URL:",
      config.url
    );
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log("✅ axios 인터셉터 - Authorization 헤더 설정 완료");
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// // refresh token
// instance.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError<{ message: string }>) => {
//     if (
//       error.response?.status === 401 &&
//       error.response?.data?.message !== "현재 비밀번호가 일치하지 않습니다."
//     ) {
//       const originalRequest = error.config as InternalAxiosRequestConfig & {
//         _retry?: boolean;
//       };

//       if (!originalRequest || originalRequest._retry) {
//         return Promise.reject(error);
//       }

//       originalRequest._retry = true;

//       try {
//         const refreshToken = localStorage.getItem("refresh_token");
//         if (!refreshToken) throw new Error("Refresh token not found");

//         const res = await axios.post(
//           "/auth/refresh-token",
//           {},
//           {
//             baseURL: BASE_URL,
//             headers: {
//               Authorization: `Bearer ${refreshToken}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         const newAccessToken = res.data.accessToken;

//         if (newAccessToken) {
//           localStorage.setItem("access_token", newAccessToken);
//           originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//           return instance(originalRequest);
//         }
//       } catch (refreshError) {
//         console.error("Error refreshing token:", refreshError);
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("refresh_token");
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

export default instance;
