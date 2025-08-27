"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type {
  UpdateCenterSettingsRequest,
  UpdateCenterSettingsResponse,
} from "@/types/center";

export const useUpdateCenterSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateCenterSettingsResponse,
    Error,
    UpdateCenterSettingsRequest
  >({
    mutationFn: async (data: UpdateCenterSettingsRequest) => {
      const response = await instance.put<UpdateCenterSettingsResponse>(
        "/centers/update",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 관련 캐시 무효화 (필요 시 확장)
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["myCenter"] });
    },
  });
};
