"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

const uploadAnimalImages = async (data: {
  images: File[];
}): Promise<{ message: string; images: string[] }> => {
  const urls: string[] = [];

  for (const file of data.images) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "animals"); // 동물 이미지는 animals 폴더에 저장

    const res = await instance.post(`/cloudflare/upload-multipart`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    if (!res.data?.success) {
      throw new Error(res.data?.message || "이미지 업로드에 실패했습니다");
    }

    urls.push(res.data.file_url);
  }

  return { message: "동물 이미지 업로드 완료", images: urls };
};

export const useUploadAnimalImages = () =>
  useMutation({
    mutationFn: uploadAnimalImages,
    onError: (error) => {
      console.error("동물 이미지 업로드 실패:", error);
    },
  });
