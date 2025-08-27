"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

// 단일 이미지 업로드
interface UploadSingleImageData {
  postId: string;
  image: File;
}

interface UploadSingleImageResponse {
  message: string;
  imageId: string;
  imageUrl: string;
  orderIndex: number;
  fileName: string;
}

export const useUploadSingleImage = () => {
  const queryClient = useQueryClient();

  return useMutation<UploadSingleImageResponse, Error, UploadSingleImageData>({
    mutationFn: async ({ postId, image }: UploadSingleImageData) => {
      const formData = new FormData();
      formData.append("image", image);

      const response = await instance.post<UploadSingleImageResponse>(
        `/posts/${postId}/images`,
        formData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 포스트 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      // 포스트 목록 쿼리 무효화
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

interface UploadedImage {
  imageId: string;
  imageUrl: string;
  orderIndex: number;
  fileName: string;
}

interface UploadMultipleImagesResponse {
  message: string;
  uploadedCount: number;
  images: UploadedImage[];
}

export const useUploadMultipleImages = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UploadMultipleImagesResponse,
    Error,
    UploadMultipleImagesData
  >({
    mutationFn: async ({ postId, images }: UploadMultipleImagesData) => {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await instance.post<UploadMultipleImagesResponse>(
        `/posts/${postId}/images/batch`,
        formData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 포스트 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      // 포스트 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
    onError: (error) => {
      console.error("다중 이미지 업로드 에러:", error);
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

export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteImageResponse, Error, DeleteImageData>({
    mutationFn: async ({ postId, imageId }: DeleteImageData) => {
      const response = await instance.delete<DeleteImageResponse>(
        `/posts/${postId}/images/${imageId}`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 포스트 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      // 포스트 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
};

// 이미지 순서 변경
interface ImageOrder {
  imageId: string;
  orderIndex: number;
}

interface UpdateImageOrderData {
  postId: string;
  imageOrders: ImageOrder[];
}

interface UpdateImageOrderResponse {
  message: string;
}

export const useUpdateImageOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateImageOrderResponse, Error, UpdateImageOrderData>({
    mutationFn: async ({ postId, imageOrders }: UpdateImageOrderData) => {
      const response = await instance.put<UpdateImageOrderResponse>(
        `/posts/${postId}/images/order`,
        { imageOrders }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 포스트 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      // 포스트 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
};
