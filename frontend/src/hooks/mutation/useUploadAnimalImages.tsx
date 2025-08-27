import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UploadAnimalImageResponse {
  message: string;
  imageId: string;
  imageUrl: string;
  orderIndex: number;
  fileName: string;
}

interface UploadAnimalImagesParams {
  animalId: string;
  images: File[];
}

export const useUploadAnimalImages = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UploadAnimalImageResponse[],
    Error,
    UploadAnimalImagesParams
  >({
    mutationFn: async ({ animalId, images }: UploadAnimalImagesParams) => {
      if (images.length === 0) {
        return [];
      }

      // 단일 이미지인 경우 개별 업로드
      if (images.length === 1) {
        const formData = new FormData();
        formData.append("image", images[0]);

        const response = await instance.post<UploadAnimalImageResponse>(
          `/animals/${animalId}/images`,
          formData
        );

        if (response.status !== 200) {
          console.error("단일 이미지 업로드 응답 에러:", {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          });

          const responseText = (await response.data) as unknown as string;
          console.error("단일 이미지 응답 내용:", responseText);

          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.error || "이미지 업로드에 실패했습니다");
          } catch (jsonError) {
            throw new Error(
              `서버 에러 (${response.status}): ${(
                responseText as string
              ).substring(0, 100)}...`
            );
          }
        }

        const result = await response.data;
        return [result];
      }

      // 다중 이미지인 경우 배치 업로드
      const formData = new FormData();
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await instance.post<UploadAnimalImageResponse[]>(
        `/animals/${animalId}/images/batch`,
        formData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 동물 이미지 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["animal", variables.animalId, "images"],
      });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
    },
    onError: (error) => {
      console.error("이미지 업로드 실패:", error);
    },
  });
};
