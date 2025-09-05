"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { PushTokenRequest, PushTokenResponse } from "@/types/notifications";

export const useRegisterPushToken = () => {
  return useMutation<PushTokenResponse, Error, PushTokenRequest>({
    mutationFn: async (data: PushTokenRequest) => {
      const response = await instance.post("/notifications/push-token", data);
      return response.data;
    },
    onSuccess: () => {
      console.log("푸시 토큰이 성공적으로 등록되었습니다.");
    },
    onError: (error) => {
      console.error("푸시 토큰 등록 실패:", error);
    },
  });
};
