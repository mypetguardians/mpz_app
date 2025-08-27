"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UpdateQuestionSequenceData {
  sequence: number;
}

interface UpdateQuestionSequenceResponse {
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

export const useUpdateQuestionSequence = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateQuestionSequenceResponse,
    Error,
    { questionId: string; data: UpdateQuestionSequenceData }
  >({
    mutationFn: async ({ questionId, data }) => {
      const response = await instance.patch<UpdateQuestionSequenceResponse>(
        `/centers/procedures/questions/${questionId}/sequence`,
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
