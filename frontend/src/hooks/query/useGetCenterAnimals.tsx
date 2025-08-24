import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import type { AnimalResponseSchema } from "@/server/openapi/routes/animal";
import { z } from "zod";
import instance from "@/lib/axios-instance";

type Animal = z.infer<typeof AnimalResponseSchema>;

interface GetMyCenterAnimalsParams {
  status?:
    | "보호중"
    | "입양완료"
    | "무지개다리"
    | "임시보호중"
    | "반환"
    | "방사";
  breed?: string;
  gender?: "male" | "female";
  weight?: "10kg_under" | "25kg_under" | "over_25kg";
  age?: "2_under" | "7_under" | "over_7";
  hasTrainerComment?: "true" | "false";
  page?: number;
  limit?: number;
}

interface GetMyCenterAnimalsResponse {
  animals: Animal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const getMyCenterAnimals = async (
  params?: GetMyCenterAnimalsParams
): Promise<GetMyCenterAnimalsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const url = `/centers/animals?${searchParams.toString()}`;
  const response = await instance.get<GetMyCenterAnimalsResponse>(url);
  return response.data;
};

export const useGetMyCenterAnimals = (
  params?: GetMyCenterAnimalsParams,
  options?: { enabled?: boolean }
) => {
  const queryResult = useQuery({
    queryKey: ["myCenterAnimals", params],
    queryFn: () => getMyCenterAnimals(params),
    staleTime: 5 * 60 * 1000, // 5분
    enabled: options?.enabled ?? true,
  });

  return queryResult;
};
