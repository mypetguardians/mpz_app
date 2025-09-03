import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type { Consent } from "@/types";

export function useGetConsents() {
  return useQuery({
    queryKey: ["consents"],
    queryFn: async (): Promise<Consent[]> => {
      const response = await instance.get<Consent[]>(
        "/centers/procedures/consent/"
      );
      return response.data;
    },
  });
}
