import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios-instance";
import { GetCenterProcedureQuestionsResponse } from "@/types";

interface UseGetCenterProcedureQuestionsParams {
  centerId: string;
}

const getCenterProcedureQuestions = async (
  centerId: string
): Promise<GetCenterProcedureQuestionsResponse> => {
  const response = await axiosInstance.get(
    `/centers/procedures/questions/center/${centerId}`
  );
  return response.data;
};

export const useGetCenterProcedureQuestions = (
  { centerId }: UseGetCenterProcedureQuestionsParams,
  options?: Omit<
    UseQueryOptions<GetCenterProcedureQuestionsResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["centerProcedureQuestions", centerId],
    queryFn: () => getCenterProcedureQuestions(centerId),
    enabled: !!centerId,
    ...options,
  });
};
