import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UpdateProfileRequest {
  name?: string;
  nickname?: string;
  phoneNumber?: string;
  image?: string;
}

interface UpdateProfileResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    nickname: string | null;
    phoneNumber: string | null;
    userType: "일반사용자" | "센터관리자" | "훈련사" | "최고관리자" | null;
    isPhoneVerified: boolean | null;
    image: string | null;
    createdAt: string;
  };
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileRequest>({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await instance.put<UpdateProfileResponse>(
        "/users/profile",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 프로필 정보 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
};
