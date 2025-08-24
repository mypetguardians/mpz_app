import type { R2Bucket } from "@cloudflare/workers-types";
import { config } from "@/config";

/**
 * 지원하는 이미지 MIME 타입
 */
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * 최대 파일 크기 (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface R2UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
  };
}

export const IMAGE_FOLDERS = {
  ANIMALS: "animals",
  CENTERS: "centers",
  POSTS: "posts",
  USERS: "users",
} as const;

/**
 * 파일 유효성 검증
 */
export function validateImageFile(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB까지 업로드 가능합니다.`,
    };
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
    return {
      isValid: false,
      error: `지원하지 않는 파일 형식입니다. 지원 형식: ${SUPPORTED_IMAGE_TYPES.join(", ")}`,
    };
  }

  // 간단 보안 체크
  if (file.name.includes("..") || file.name.includes("/") || file.name.includes("\\")) {
    return { isValid: false, error: "파일명에 부적절한 문자가 포함되어 있습니다." };
  }

  return { isValid: true };
}

/**
 * 안전한 파일명 생성 (확장자 중복 제거)
 */
export function generateSafeFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().substring(0, 8);

  const lastDot = originalName.lastIndexOf(".");
  const base = (lastDot > -1 ? originalName.slice(0, lastDot) : originalName)
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50);
  const ext = (lastDot > -1 ? originalName.slice(lastDot + 1) : "jpg").toLowerCase();

  const filename = `${timestamp}-${randomId}-${base}.${ext}`;
  return prefix ? `${prefix}/${filename}` : filename;
}

/**
 * 퍼블릭 URL 생성 (r2.dev)
 */
export function generatePublicUrl(key: string): string {
  // R2 Public Development URL 사용 (기존에 확인된 URL)
  const baseUrl = "https://pub-cb782373d9db4c77afff3d6f1e4d28af.r2.dev";
  return `${baseUrl}/${key.replace(/^\/+/, "")}`;
}

/**
 * 업로드 (Workers 바인딩 있으면 바인딩, 없으면 AWS SDK v3로 SigV4 업로드)
 */
export async function uploadToR2(
  file: File,
  bucket: R2Bucket | null,
  key: string,
  options?: R2UploadOptions
): Promise<string> {
  try {
    if (!bucket) {
      // Next.js(Node) 환경: S3 호환 SDK 사용
      return await uploadToR2ViaS3SDK(file, key, options);
    }

    const arrayBuffer = await file.arrayBuffer();

    const defaultOptions: R2UploadOptions = {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000",
        contentDisposition: "inline",
      },
      metadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        size: String(file.size),
        ...options?.metadata,
      },
    };

    const uploadOptions = {
      ...defaultOptions,
      ...options,
      httpMetadata: {
        ...defaultOptions.httpMetadata,
        ...options?.httpMetadata,
      },
    };

    await bucket.put(key, arrayBuffer, uploadOptions);
    return generatePublicUrl(key);
  } catch (error) {
    console.error("R2 업로드 실패:", error);
    throw new Error(
      `파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * S3 호환 SDK를 통한 R2 업로드 (Next.js 서버 전용)
 */
async function uploadToR2ViaS3SDK(
  file: File,
  key: string,
  options?: R2UploadOptions
): Promise<string> {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT; // https://<accountid>.r2.cloudflarestorage.com
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    console.warn("[r2-utils] R2 SDK 환경변수 미설정  퍼블릭 URL만 반환(실제 업로드는 수행 안됨).");
    return generatePublicUrl(key);
  }

  // 런타임이 Edge인 경우 SDK가 동작하지 않을 수 있음 → Node로 실행해야 함
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const body = Buffer.from(await file.arrayBuffer());

  const cacheControl =
    options?.httpMetadata?.cacheControl ?? "public, max-age=31536000";
  const contentType = options?.httpMetadata?.contentType ?? file.type;
  const contentDisposition = options?.httpMetadata?.contentDisposition ?? "inline";

  const metadata = {
    uploadedAt: new Date().toISOString(),
    originalName: file.name,
    size: String(file.size),
    ...(options?.metadata ?? {}),
  };

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
      ContentDisposition: contentDisposition,
      Metadata: metadata,
    })
  );

  return generatePublicUrl(key);
}

/**
 * (선택) Presigned URL 생성 – 프라이빗 모드에서만 사용 권장
 */
export async function generatePresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    console.warn("[r2-utils] Presigned URL: 환경변수 미설정 – 퍼블릭 URL 반환.");
    return generatePublicUrl(key);
  }

  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const cmd = new GetObjectCommand({ Bucket: bucketName, Key: key });
  return getSignedUrl(client, cmd, { expiresIn });
}

/**
 * URL/도메인 상관없이 R2 키만 뽑기
 */
export function extractR2KeyFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/+/, "");
  } catch {
    // 비정상 URL 문자열 폴백
    return url.replace(/^https?:\/\/[^/]+\/+/, "").replace(/^\/+/, "");
  }
}

/**
 * 이미지 리사이징 URL 생성 (prod 전용, 프록시 도메인 필요)
 * - 개발환경: 원본 URL 그대로 반환
 * - 프로덕션: R2_IMAGE_RESIZE_BASE(네 도메인, Cloudflare 프록시 통과) 사용
 */
export function generateResizedImageUrl(
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
    quality?: number;
    format?: "auto" | "webp" | "avif" | "json";
  } = {}
): string {
  if (config.env !== "prod") return originalUrl;

  const resizeBase = process.env.R2_IMAGE_RESIZE_BASE; // 예: https://img.example.com
  if (!resizeBase) return originalUrl;

  const {
    width,
    height,
    fit = "scale-down",
    quality = 85,
    format = "auto",
  } = options;

  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("fit", fit);
  params.set("quality", String(quality));
  params.set("format", format);

  const key = extractR2KeyFromUrl(originalUrl);
  const base = resizeBase.replace(/\/+$/, "");
  return `${base}/cdn-cgi/image/${params.toString()}/${key}`;
}

/**
 * 배치 업로드
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: R2Bucket | null,
  pathPrefix: string,
  options?: R2UploadOptions
): Promise<Array<{ file: File; url: string; key: string }>> {
  const results: Array<{ file: File; url: string; key: string }> = [];

  try {
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(`${file.name}: ${validation.error}`);
      }

      const key = generateSafeFileName(file.name, pathPrefix);
      const url = await uploadToR2(file, bucket, key, options);

      results.push({ file, url, key });
    }
    return results;
  } catch (error) {
    console.error("다중 파일 업로드 실패:", error);
    // Workers 바인딩 있는 경우에만 롤백
    if (results.length > 0 && bucket) {
      console.log("업로드된 파일 롤백 중...");
      for (const r of results) {
        try {
          await bucket.delete(r.key);
        } catch (e) {
          console.error(`파일 롤백 실패: ${r.key}`, e);
        }
      }
    }
    throw error;
  }
}

/**
 * R2 헬스체크 (Workers 바인딩 필요)
 */
export async function checkR2Health(bucket: R2Bucket): Promise<boolean> {
  try {
    const testKey = `health-check-${Date.now()}.txt`;
    await bucket.put(testKey, "health check");
    await bucket.delete(testKey);
    return true;
  } catch (error) {
    console.error("R2 헬스체크 실패:", error);
    return false;
  }
}
