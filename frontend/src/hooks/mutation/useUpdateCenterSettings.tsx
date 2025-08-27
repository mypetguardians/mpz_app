"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export interface UpdateCenterSettingsRequest {
  name?: string;
  centerNumber?: string;
  description?: string;
  location?: string;
  region?:
    | "서울"
    | "부산"
    | "대구"
    | "인천"
    | "광주"
    | "대전"
    | "울산"
    | "세종"
    | "경기"
    | "강원"
    | "충북"
    | "충남"
    | "전북"
    | "전남"
    | "경북"
    | "경남"
    | "제주";
  phoneNumber?: string;
  adoptionProcedure?: string;
  adoptionGuidelines?: string;
  hasMonitoring?: boolean;
  monitoringPeriodMonths?: number;
  monitoringIntervalDays?: number;
  monitoringDescription?: string;
  isPublic?: boolean;
  adoptionPrice?: number;
  imageUrl?: string;
}

export interface UpdateCenterSettingsResponse {
  id: string;
  name: string;
  centerNumber: string | null;
  description: string | null;
  location: string | null;
  region: UpdateCenterSettingsRequest["region"] | null;
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
  createdAt: string;
  updatedAt: string;
}

export const useUpdateCenterSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateCenterSettingsResponse,
    Error,
    UpdateCenterSettingsRequest
  >({
    mutationFn: async (data: UpdateCenterSettingsRequest) => {
      const response = await instance.put<UpdateCenterSettingsResponse>(
        "/centers/settings",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 관련 캐시 무효화 (필요 시 확장)
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["myCenter"] });
    },
  });
};
