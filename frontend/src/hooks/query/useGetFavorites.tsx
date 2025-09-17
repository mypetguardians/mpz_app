import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { CenterFavoritesApiResponse } from "@/types/favorites";

// API 응답을 기존 형식으로 변환하는 함수
const transformCenterFavorites = (apiResponse: CenterFavoritesApiResponse) => {
  return {
    centers: apiResponse.data.map((item) => ({
      id: item.id,
      name: item.name,
      location: item.location,
      region: item.region,
      phoneNumber: item.phone_number,
      imageUrl: item.image_url,
      isFavorited: item.is_favorited,
      favoritedAt: item.favorited_at,
    })),
    total: apiResponse.totalCnt,
    page: apiResponse.curPage,
    limit: apiResponse.count,
    totalPages: apiResponse.pageCnt,
    hasNext: apiResponse.nextPage > 0,
    hasPrev: apiResponse.previousPage > 0,
  };
};

const transformAnimalFavorites = (apiResponse: Record<string, unknown>) => {
  // 새로운 API 응답 구조에 맞게 변환
  return {
    animals: (apiResponse.animals as Record<string, unknown>[]).map(
      (item: Record<string, unknown>) => ({
        id: item.id as string,
        name: item.name as string,
        breed: item.breed as string,
        age: item.age as number,
        isFemale: item.isFemale as boolean,
        status: (item.status as string) || (item.protection_status as string), // status가 없으면 protection_status 사용
        protection_status: item.protection_status as string,
        adoption_status: item.adoption_status as string,
        foundLocation: item.foundLocation as string,
        personality: item.personality as string,
        centerId: item.centerId as string,
        centerName: item.centerName as string,
        animalImages: (item.animalImages as string[]) || [],
        isFavorited: item.isFavorited as boolean,
        favoritedAt: item.favoritedAt as string,
      })
    ),
    total: apiResponse.total as number,
    page: apiResponse.page as number,
    limit: apiResponse.limit as number,
    totalPages: apiResponse.totalPages as number,
    hasNext: apiResponse.hasNext as boolean,
    hasPrev: apiResponse.hasPrev as boolean,
  };
};

// 찜한 동물 목록 조회
const fetchAnimalFavorites = async (
  page?: number,
  limit?: number
): Promise<Record<string, unknown>> => {
  const params = new URLSearchParams();
  if (page !== undefined) params.append("page", page.toString());
  if (limit !== undefined) params.append("limit", limit.toString());

  const response = await instance.get<Record<string, unknown>>(
    `/favorites/animals?${params}`
  );
  return response.data;
};

// 찜한 센터 목록 조회
const fetchCenterFavorites = async (
  page?: number,
  limit?: number
): Promise<CenterFavoritesApiResponse> => {
  const params = new URLSearchParams();
  if (page !== undefined) params.append("page", page.toString());
  if (limit !== undefined) params.append("limit", limit.toString());

  const response = await instance.get<CenterFavoritesApiResponse>(
    `/favorites/centers?${params}`
  );
  return response.data;
};

// 찜한 동물 목록 조회 훅
export const useGetAnimalFavorites = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["animalFavorites", page, limit],
    queryFn: () => fetchAnimalFavorites(page, limit),
    select: transformAnimalFavorites,
    staleTime: 1 * 60 * 1000, // 1분으로 단축 (더 자주 업데이트)
    gcTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: true, // 윈도우 포커스 시 refetch
    refetchOnMount: true, // 마운트 시 refetch
  });
};

// 찜한 센터 목록 조회 훅
export const useGetCenterFavorites = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["centerFavorites", page, limit],
    queryFn: () => fetchCenterFavorites(page, limit),
    select: transformCenterFavorites,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
