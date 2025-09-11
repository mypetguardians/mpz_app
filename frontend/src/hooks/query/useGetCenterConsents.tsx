import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type { Consent } from "@/types";

export function useGetCenterConsents(centerId: string) {
  return useQuery({
    queryKey: ["center-consents", centerId],
    queryFn: async (): Promise<Consent[]> => {
      const response = await instance.get<Consent[]>(
        `/centers/procedures/consent/center/${centerId}`
      );
      return response.data;
    },
    enabled: !!centerId,
  });
}
