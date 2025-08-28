"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface CreateQuestionFormData {
  question: string;
  type: string;
  options?: string[];
  isRequired?: boolean;
  sequence?: number;
}

interface CreateQuestionFormResponse {
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

export const useCreateQuestionForm = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateQuestionFormResponse, Error, CreateQuestionFormData>(
    {
      mutationFn: async (data: CreateQuestionFormData) => {
        const response = await instance.post<CreateQuestionFormResponse>(
          "/centers/procedures/questions/",
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
    }
  );
};
