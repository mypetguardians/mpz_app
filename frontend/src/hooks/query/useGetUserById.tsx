import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios-instance";
import { UserProfile } from "@/types/auth";

// 특정 사용자 프로필 조회 API
const getUserById = async (userId: string): Promise<UserProfile> => {
  const response = await axiosInstance.get(`/auth/${userId}`);
  return response.data;
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: ["userById", userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId, // userId가 있을 때만 쿼리 실행
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
