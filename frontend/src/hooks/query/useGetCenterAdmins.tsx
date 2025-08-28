import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export interface CenterAdmin {
  id: string;
  name: string;
  email: string;
  centerId: string;
  centerName: string;
  userType: string;
  createdAt: string;
  updatedAt: string;
}

interface GetCenterAdminsResponse {
  admins: CenterAdmin[];
}

const getCenterAdmins = async (): Promise<GetCenterAdminsResponse> => {
  const response = await instance.get<GetCenterAdminsResponse>(
    "/admin/center-admins"
  );
  return response.data;
};

export const useGetCenterAdmins = (options?: { enabled?: boolean }) => {
  const queryResult = useQuery({
    queryKey: ["centerAdmins"],
    queryFn: () => getCenterAdmins(),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    enabled: options?.enabled ?? true,
  });

  return queryResult;
};
