"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface DeleteQuestionFormResponse {
  message: string;
}

export const useDeleteQuestionForm = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteQuestionFormResponse, Error, string>({
    mutationFn: async (questionId: string) => {
      const response = await instance.delete<DeleteQuestionFormResponse>(
        `/centers/procedures/questions/${questionId}`
      );
      return response.data;
    },
    onSuccess: () => {
      // 질문 폼 목록 쿼리 무효화하여 새로고침
      queryClient.invalidateQueries({
        queryKey: ["questionForms"],
      });
    },
  });
};
