import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import instance from "@/lib/axios-instance";

interface Center {
  id: string;
  userId: string;
  name: string;
  centerNumber: string | null;
  description: string | null;
  location: string | null;
  region: string | null;
  phoneNumber: string | null;
  adoptionProcedure: string | null;
  adoptionGuidelines: string | null;
  hasMonitoring: boolean;
  monitoringPeriodMonths: number | null;
  monitoringIntervalDays: number | null;
  monitoringDescription: string | null;
  verified: boolean;
  isPublic: boolean;
  adoptionPrice: number;
  imageUrl: string | null;
  isSubscriber: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useGetMyCenter = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery<Center>({
    queryKey: ["myCenter"],
    queryFn: async () => {
      // user.centers가 있으면 해당 정보를 사용
      if (user?.centers) {
        const centerData: Center = {
          id: user.centers.id,
          userId: user.id,
          name: user.centers.name,
          centerNumber: user.centers.centerNumber,
          description: user.centers.description,
          location: user.centers.location,
          region: user.centers.region,
          phoneNumber: user.centers.phoneNumber,
          adoptionProcedure: null,
          adoptionGuidelines: null,
          hasMonitoring: false,
          monitoringPeriodMonths: null,
          monitoringIntervalDays: null,
          monitoringDescription: null,
          verified: user.centers.verified,
          isPublic: user.centers.isPublic,
          adoptionPrice: user.centers.adoptionPrice,
          imageUrl: user.centers.imageUrl,
          isSubscriber: user.centers.isSubscriber || false,
          createdAt: user.centers.createdAt,
          updatedAt: user.centers.updatedAt,
        };
        return centerData;
      }

      // user.centers가 없으면 API 호출
      const response = await instance.get<Center>("/centers/me");
      return response.data;
    },
    enabled: !!user && user.userType === "센터관리자",
    retry: false,
  });
};

// 센터 정보 업데이트 후 캐시 무효화를 위한 함수
export const invalidateMyCenter = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["myCenter"] });
};
