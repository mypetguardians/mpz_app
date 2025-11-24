import { Camera, CameraSource, CameraResultType } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

/**
 * 이미지 선택 유틸리티
 * 웹: 파일 입력 사용
 * 앱: Capacitor Camera 플러그인 사용 (갤러리에서 선택)
 */
export async function pickImages(
  options: {
    multiple?: boolean;
    maxCount?: number;
  } = {}
): Promise<File[]> {
  const { multiple = false, maxCount = 5 } = options;
  const isNative = Capacitor.isNativePlatform();

  // 앱 환경: Capacitor Camera 플러그인 사용
  if (isNative) {
    try {
      const images: File[] = [];

      if (multiple && maxCount > 1) {
        // 여러 이미지 선택: pickImages 메서드 사용 (지원되는 경우)
        // 일부 버전에서는 pickImages가 없을 수 있으므로 try-catch로 처리
        try {
          // pickImages는 타입 정의에 없을 수 있으므로 타입 단언 사용
          const cameraWithPickImages = Camera as typeof Camera & {
            pickImages?: (options: {
              quality: number;
              limit: number;
            }) => Promise<{ photos: Array<{ webPath: string }> }>;
          };

          if (cameraWithPickImages.pickImages) {
            const photos = await cameraWithPickImages.pickImages({
              quality: 90,
              limit: maxCount,
            });

            // 여러 이미지를 File로 변환
            for (const photo of photos.photos) {
              const response = await fetch(photo.webPath!);
              const blob = await response.blob();
              const fileName = `image_${Date.now()}_${images.length}.jpg`;
              const file = new File([blob], fileName, { type: blob.type });
              images.push(file);
            }
          } else {
            throw new Error("pickImages not supported");
          }
        } catch {
          // pickImages가 지원되지 않는 경우, 단일 선택 반복
          // 사용자 경험을 위해 한 번만 선택하도록 함
          const photo = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Photos, // 갤러리에서 선택
          });

          const response = await fetch(photo.webPath!);
          const blob = await response.blob();
          const fileName = `image_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: blob.type });
          images.push(file);
        }
      } else {
        // 단일 이미지 선택
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos, // 갤러리에서 선택
        });

        // URI를 File로 변환
        const response = await fetch(photo.webPath!);
        const blob = await response.blob();
        const fileName = `image_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: blob.type });
        images.push(file);
      }

      return images;
    } catch (error) {
      // 사용자가 취소한 경우 빈 배열 반환
      if (
        error instanceof Error &&
        (error.message.includes("cancel") ||
          error.message.includes("User cancelled"))
      ) {
        return [];
      }
      throw error;
    }
  }

  // 웹 환경: 파일 입력 사용 (기존 방식)
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = multiple;

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files ? Array.from(target.files) : [];
      resolve(files.slice(0, maxCount));
    };

    input.oncancel = () => {
      resolve([]);
    };

    input.click();
  });
}
