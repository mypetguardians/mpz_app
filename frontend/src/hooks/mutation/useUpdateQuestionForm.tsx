"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UpdateQuestionFormData {
  question?: string;
  type?: string;
  options?: string[];
  isRequired?: boolean;
  sequence?: number;
}

interface UpdateQuestionFormResponse {
  id: string;
  centerId: string;
  question: string;
  type: string;
  options: string[] | null;
  isRequired: boolean;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

export const useUpdateQuestionForm = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateQuestionFormResponse,
    Error,
    { questionId: string; data: UpdateQuestionFormData }
  >({
    mutationFn: async ({ questionId, data }) => {
      const response = await instance.put<UpdateQuestionFormResponse>(
        `/centers/procedures/questions/${questionId}`,
        data
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
