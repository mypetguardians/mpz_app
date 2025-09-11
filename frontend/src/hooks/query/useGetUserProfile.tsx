import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios-instance";
import { UserProfile } from "@/types/auth";

// 사용자 프로필 조회 API
const getUserProfile = async (): Promise<UserProfile> => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

export const useGetUserProfile = () => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
