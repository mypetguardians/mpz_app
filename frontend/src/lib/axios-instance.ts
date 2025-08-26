import axios, {
  AxiosInstance,
  // AxiosError,
  // InternalAxiosRequestConfig,
} from "axios";
// import Cookies from "js-cookie";

const BASE_URL = "https://mpzfullstack-production.up.railway.app/v1/";

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 쿠키 자동 전송을 위해 true로 변경
});

// // header
// instance.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     const accessToken = Cookies.get("accessToken");
//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
//   },
//   (error: AxiosError) => {
//     return Promise.reject(error);
//   }
// );

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
//         const refreshToken = Cookies.get("refreshToken");
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
//           Cookies.set("accessToken", newAccessToken);
//           originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//           return instance(originalRequest);
//         }
//       } catch (refreshError) {
//         console.error("Error refreshing token:", refreshError);
//         Cookies.remove("accessToken");
//         Cookies.remove("refreshToken");
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

export default instance;
