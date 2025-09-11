import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type { Consent } from "@/types";

export function useGetConsent(consentId: string) {
  return useQuery({
    queryKey: ["consent", consentId],
    queryFn: async (): Promise<Consent> => {
      const response = await instance.get<Consent>(
        `/centers/procedures/consent/${consentId}`
      );
      return response.data;
    },
    enabled: !!consentId,
  });
}
