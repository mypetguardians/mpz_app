// hooks/useUploadImages.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

const uploadImages = async (data: {
  postId: string;
  images: File[];
}): Promise<{ message: string; images: string[] }> => {
  const urls: string[] = [];

  for (const file of data.images) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "uploads");

    const res = await instance.post(`/cloudflare/upload-multipart`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    if (!res.data?.success) throw new Error(res.data?.message || "업로드 실패");
    urls.push(res.data.file_url);
  }

  return { message: "이미지 업로드 완료", images: urls };
};

export const useUploadImages = () => useMutation({ mutationFn: uploadImages });
