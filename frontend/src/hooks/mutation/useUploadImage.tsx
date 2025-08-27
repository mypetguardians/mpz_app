"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UploadImageData {
  file: File;
}

interface UploadImageResponse {
  message: string;
  imageUrl: string;
}

const uploadImage = async (
  data: UploadImageData
): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append("image", data.file);

  const response = await instance.post<UploadImageResponse>(
    "/upload/image",
    formData
  );
  return response.data;
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: uploadImage,
  });
};
