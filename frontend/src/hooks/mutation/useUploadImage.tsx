"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { UploadImageData, UploadImageResponse } from "@/types/images";

const uploadImage = async (
  data: UploadImageData
): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append("image", data.file);

  const response = await instance.post<UploadImageResponse>(
    `/cloudflare/upload`,
    formData
  );
  return response.data;
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: uploadImage,
  });
};
