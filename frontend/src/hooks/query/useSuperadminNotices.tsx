import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { SuperadminNoticesResponse } from "@/types/notifications";

export function useSuperadminNotices() {
  return useQuery({
    queryKey: ["superadminNotices"],
    queryFn: async (): Promise<SuperadminNoticesResponse> => {
      const res = await instance.get<SuperadminNoticesResponse>(
        "/notices/superadmin"
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
