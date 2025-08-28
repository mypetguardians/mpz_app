"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

const uploadImages = async (data: {
  postId: string;
  images: File[];
}): Promise<{ message: string; images: string[] }> => {
  const uploadPromises = data.images.map(async (image) => {
    // File을 base64로 변환 (간단하고 안정적인 방식)
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/jpeg;base64, 부분 제거
        resolve(result.split(",")[1]);
      };
      reader.readAsDataURL(image);
    });

    const payload = {
      file: base64,
      filename: image.name,
      content_type: image.type || "application/octet-stream",
      folder: "uploads",
    };

    const response = await instance.post(`/cloudflare/upload`, payload);
    return response.data.file_url;
  });

  const imageUrls = await Promise.all(uploadPromises);

  return {
    message: "이미지 업로드 완료",
    images: imageUrls,
  };
};

export const useUploadImages = () => {
  return useMutation({
    mutationFn: uploadImages,
  });
};
