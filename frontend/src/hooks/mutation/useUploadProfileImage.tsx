"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UploadProfileImageParams {
  file: string;
  filename: string;
  content_type?: string;
  folder?: string;
}

interface UploadProfileImageResponse {
  success: boolean;
  message: string;
  file_url: string;
  file_key: string;
  uploaded_at: string;
}

const uploadProfileImage = async (
  data: UploadProfileImageParams
): Promise<UploadProfileImageResponse> => {
  const res = await instance.post("/cloudflare/upload", {
    file: data.file,
    filename: data.filename,
    content_type: data.content_type || "image/jpeg",
    folder: data.folder || "profiles",
  });

  if (!res.data?.success) {
    throw new Error(res.data?.message || "프로필 이미지 업로드에 실패했습니다");
  }

  return res.data;
};

export const useUploadProfileImage = () =>
  useMutation({
    mutationFn: uploadProfileImage,
  });
