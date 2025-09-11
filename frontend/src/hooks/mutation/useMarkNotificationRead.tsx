"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface MarkNotificationReadResponse {
  message: string;
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation<MarkNotificationReadResponse, Error, string>({
    mutationFn: async (notificationId: string) => {
      const response = await instance.put<MarkNotificationReadResponse>(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    },
    onSuccess: () => {
      // 알림 관련 쿼리 무효화하여 새로고침
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
};
