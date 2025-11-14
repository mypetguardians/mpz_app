import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// 동의서 무효화 및 새로고침 함수
export function useInvalidateConsents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 쿼리 무효화만 수행
      await queryClient.invalidateQueries({ queryKey: ["consents"] });
    },
    onSuccess: () => {
      // 무효화 후 자동으로 새로고침됨
      console.log("동의서 쿼리가 무효화되었습니다.");
    },
  });
}
