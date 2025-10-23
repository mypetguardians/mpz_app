import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  birth?: string | null;
  address?: string | null;
  nickname?: string | null;
  phone_number?: string | null;
  user_type: "일반사용자" | "센터관리자" | "훈련사" | "센터최고관리자" | null;
  is_phone_verified: boolean | null;
  image?: string | null;
  created_at: string;
}

export const useGetMyProfile = () => {
  return useQuery<UserProfile>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const response = await instance.get<UserProfile>("/auth/me");
      return response.data;
    },
    retry: false, // 401 에러 시 재시도하지 않음
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
