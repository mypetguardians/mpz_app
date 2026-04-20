export function getProxyImageUrl(imageUrl?: string | null) {
  if (!imageUrl || imageUrl.trim() === "") return null;

  const trimmedUrl = imageUrl.trim();

  if (
    trimmedUrl.startsWith("/") ||
    trimmedUrl.startsWith("data:") ||
    trimmedUrl.startsWith("blob:") ||
    trimmedUrl.startsWith("/api/proxy-image")
  ) {
    return trimmedUrl;
  }

  // http/https 외 URL은 그대로 반환
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  // HTTPS URL은 브라우저가 직접 fetch (EC2 서버 경유 불필요)
  if (trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }

  // HTTP URL은 mixed content 방지를 위해 프록시 경유
  return `/api/proxy-image?url=${encodeURIComponent(trimmedUrl)}`;
}
