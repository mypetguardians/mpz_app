import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type { Consent, CreateConsentData } from "@/types";

export function useCreateConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConsentData): Promise<Consent> => {
      const response = await instance.post<Consent>(
        "/centers/procedures/consent/",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 동의서 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["consents"],
      });
    },
  });
}
