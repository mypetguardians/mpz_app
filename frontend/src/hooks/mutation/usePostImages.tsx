"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

// 단일 이미지 업로드
interface UploadSingleImageData {
  postId: string;
  file: File;
}

interface UploadSingleImageResponse {
  message: string;
  image: {
    id: string;
    postId: string;
    imageUrl: string;
    orderIndex: number;
    createdAt: string;
  };
}

const uploadSingleImage = async (
  data: UploadSingleImageData
): Promise<UploadSingleImageResponse> => {
  const formData = new FormData();
  formData.append("image", data.file);
  formData.append("postId", data.postId);

  const response = await instance.post<UploadSingleImageResponse>(
    `/posts/${data.postId}/images`,
    formData
  );
  return response.data;
};

export const useUploadSingleImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadSingleImage,
    onSuccess: (data, variables) => {
      // 포스트 상세 정보 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      // 포스트 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
};

// 다중 이미지 업로드
interface UploadMultipleImagesData {
  postId: string;
  images: File[];
}

interface UploadMultipleImagesResponse {
  message: string;
  images: Array<{
    id: string;
    postId: string;
    imageUrl: string;
    orderIndex: number;
    createdAt: string;
  }>;
}

const uploadMultipleImages = async (
  data: UploadMultipleImagesData
): Promise<UploadMultipleImagesResponse> => {
  const formData = new FormData();
  formData.append("postId", data.postId);

  data.images.forEach((image, index) => {
    formData.append("images", image);
  });

  const response = await instance.post<UploadMultipleImagesResponse>(
    `/posts/${data.postId}/images/multiple`,
    formData
  );
  return response.data;
};

export const useUploadMultipleImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMultipleImages,
    onSuccess: (data, variables) => {
      // 포스트 상세 정보 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      // 포스트 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
};

// 이미지 삭제
interface DeleteImageData {
  postId: string;
  imageId: string;
}

interface DeleteImageResponse {
  message: string;
}

const deleteImage = async (
  data: DeleteImageData
): Promise<DeleteImageResponse> => {
  const response = await instance.delete<DeleteImageResponse>(
    `/posts/${data.postId}/images/${data.imageId}`
  );
  return response.data;
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteImage,
    onSuccess: (data, variables) => {
      // 포스트 상세 정보 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      // 포스트 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
};

// 이미지 순서 변경
interface UpdateImageOrderData {
  postId: string;
  imageOrders: Array<{
    imageId: string;
    orderIndex: number;
  }>;
}

interface UpdateImageOrderResponse {
  message: string;
}

const updateImageOrder = async (
  data: UpdateImageOrderData
): Promise<UpdateImageOrderResponse> => {
  const response = await instance.put<UpdateImageOrderResponse>(
    `/posts/${data.postId}/images/order`,
    { imageOrders: data.imageOrders }
  );
  return response.data;
};

export const useUpdateImageOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateImageOrder,
    onSuccess: (data, variables) => {
      // 포스트 상세 정보 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      // 포스트 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
};
