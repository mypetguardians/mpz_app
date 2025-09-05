"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  DeletePushTokenRequest,
  PushTokenResponse,
} from "@/types/notifications";

export const useDeletePushToken = () => {
  return useMutation<PushTokenResponse, Error, DeletePushTokenRequest>({
    mutationFn: async (data: DeletePushTokenRequest) => {
      const response = await instance.delete("/notifications/push-token", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      console.log("푸시 토큰이 성공적으로 삭제되었습니다.");
    },
    onError: (error) => {
      console.error("푸시 토큰 삭제 실패:", error);
    },
  });
};
