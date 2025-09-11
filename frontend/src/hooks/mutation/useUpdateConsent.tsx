import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type { Consent, UpdateConsentData } from "@/types";

export function useUpdateConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      consentId,
      data,
    }: {
      consentId: string;
      data: UpdateConsentData;
    }): Promise<Consent> => {
      const response = await instance.put<Consent>(
        `/centers/procedures/consent/${consentId}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // 동의서 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["consents"],
      });
      // 특정 동의서 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["consent", variables.consentId],
      });
    },
  });
}
