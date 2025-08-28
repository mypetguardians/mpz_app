import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UpdateProfileRequest {
  name?: string;
  nickname?: string;
  phone_number?: string;
  birth?: string;
  address?: string;
  address_is_public?: boolean;
  image?: string;
}

interface UpdateProfileResponse {
  username: string;
  status: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileRequest>({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await instance.patch<UpdateProfileResponse>(
        "/auth/me",
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
