"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

const uploadImages = async (data: {
  postId: string;
  images: File[];
}): Promise<{ message: string; images: string[] }> => {
  const formData = new FormData();
  formData.append("postId", data.postId);

  data.images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await instance.post(
    `/posts/${data.postId}/images/multiple`,
    formData
  );
  return response.data;
};

export const useUploadImages = () => {
  return useMutation({
    mutationFn: uploadImages,
  });
};
