import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface MatchingSessionResponse {
  hasSession: boolean;
}

export function useCheckMatchingSession() {
  return useQuery<MatchingSessionResponse>({
    queryKey: ["check-matching-session"],
    queryFn: async () => {
      try {
        const response = await instance.get<MatchingSessionResponse>(
          "/matching/session"
        );
        return response.data;
      } catch (error) {
        console.error("매칭 세션 체크 오류:", error);
        return { hasSession: false };
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
