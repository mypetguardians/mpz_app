"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface MarkAllNotificationsReadResponse {
  message: string;
}

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<MarkAllNotificationsReadResponse, Error, void>({
    mutationFn: async () => {
      const response = await instance.put<MarkAllNotificationsReadResponse>(
        "/notifications/read-all"
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
