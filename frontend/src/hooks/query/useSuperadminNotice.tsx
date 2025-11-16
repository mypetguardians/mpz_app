import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { SuperadminNotice } from "@/types/notifications";

export function useSuperadminNotice(noticeId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["superadminNotice", noticeId],
    queryFn: async (): Promise<SuperadminNotice> => {
      const res = await instance.get<SuperadminNotice>(
        `/notices/superadmin/${noticeId}`
      );
      return res.data;
    },
    enabled: enabled && !!noticeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
