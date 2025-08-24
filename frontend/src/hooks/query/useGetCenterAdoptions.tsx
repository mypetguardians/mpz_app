import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { CenterAdoptionResponseSchema } from "@/server/openapi/routes/center-adoption";
import instance from "@/lib/axios-instance";

export type CenterAdoption = z.infer<typeof CenterAdoptionResponseSchema>;

interface GetCenterAdoptionsParams {
  page?: number;
  limit?: number;
  status?: string;
  animalId?: string;
}

interface GetCenterAdoptionsResponse {
  adoptions: CenterAdoption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const useGetCenterAdoptions = (
  params: GetCenterAdoptionsParams = {}
) => {
  return useQuery({
    queryKey: ["center-adoptions", params],
    queryFn: async (): Promise<GetCenterAdoptionsResponse> => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.status) searchParams.append("status", params.status);
      if (params.animalId) searchParams.append("animalId", params.animalId);

      const response = await instance.get<GetCenterAdoptionsResponse>(
        `/center-admin/adoptions?${searchParams.toString()}`
      );
      return response.data;
    },
    enabled: true, // 항상 활성화
  });
};
