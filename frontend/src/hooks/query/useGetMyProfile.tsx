import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  nickname: string | null;
  phoneNumber: string | null;
  userType: "일반사용자" | "센터관리자" | "훈련사" | "최고관리자" | null;
  isPhoneVerified: boolean | null;
  image: string | null;
  createdAt: string;
}

export const useGetMyProfile = () => {
  return useQuery<UserProfile>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const response = await instance.get<UserProfile>("/users/profile");
      return response.data;
    },
    retry: false, // 401 에러 시 재시도하지 않음
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
