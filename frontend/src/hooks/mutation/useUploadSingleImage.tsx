"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

const uploadSingleImage = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "uploads");

  const res = await instance.post(`/cloudflare/upload-multipart`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (!res.data?.success) {
    throw new Error(res.data?.message || "업로드 실패");
  }

  return res.data.file_url;
};

export const useUploadSingleImage = () => {
  return useMutation({
    mutationFn: uploadSingleImage,
    onError: (error) => {
      console.error("이미지 업로드 실패:", error);
    },
  });
};
