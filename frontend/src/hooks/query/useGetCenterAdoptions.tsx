import { useQuery } from "@tanstack/react-query";
import type { CenterAdoptionResponse } from "@/types/center-adoption";
import instance from "@/lib/axios-instance";

interface GetCenterAdoptionsParams {
  page?: number;
  limit?: number;
  status?: string;
  animalId?: string;
  is_temporary_protection?: boolean;
}

export const useGetCenterAdoptions = (
  params: GetCenterAdoptionsParams = {}
) => {
  return useQuery({
    queryKey: ["center-adoptions", params],
    queryFn: async (): Promise<CenterAdoptionResponse> => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.status) searchParams.append("status", params.status);
      if (params.animalId) searchParams.append("animalId", params.animalId);
      if (params.is_temporary_protection !== undefined) {
        searchParams.append(
          "is_temporary_protection",
          params.is_temporary_protection.toString()
        );
      }

      const url = `/adoptions/center-admin?${searchParams.toString()}`;

      const response = await instance.get<CenterAdoptionResponse>(url);

      return response.data;
    },
    enabled: true, // 항상 활성화
  });
};
