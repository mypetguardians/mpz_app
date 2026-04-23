/**
 * 이미지 URL 정규화
 * Supabase Storage 이관 완료로 프록시 불필요 — URL을 그대로 반환
 */
export function getProxyImageUrl(imageUrl?: string | null) {
  if (!imageUrl || imageUrl.trim() === "") return null;
  return imageUrl.trim();
}
