"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  CreateNotificationRequest,
  PushTokenResponse,
} from "@/types/notifications";

export const useCreateNotification = () => {
  return useMutation<PushTokenResponse, Error, CreateNotificationRequest>({
    mutationFn: async (data: CreateNotificationRequest) => {
      const response = await instance.post("/notifications/create", data);
      return response.data;
    },
    onSuccess: () => {
      console.log("알림이 성공적으로 생성되었습니다.");
    },
    onError: (error) => {
      console.error("알림 생성 실패:", error);
    },
  });
};
