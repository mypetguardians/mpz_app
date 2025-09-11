import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type { DeleteConsentResponse } from "@/types";

export function useDeleteConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (consentId: string): Promise<DeleteConsentResponse> => {
      const response = await instance.delete<DeleteConsentResponse>(
        `/centers/procedures/consent/${consentId}`
      );
      return response.data;
    },
    onSuccess: (_, consentId) => {
      // 동의서 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["consents"],
      });
      // 특정 동의서 캐시 제거
      queryClient.removeQueries({
        queryKey: ["consent", consentId],
      });
    },
  });
}
