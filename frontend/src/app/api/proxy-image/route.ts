import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get("url");
  const cacheControl =
    "public, max-age=86400, s-maxage=86400, immutable, stale-while-revalidate=86400";

  if (!imageUrl) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(imageUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(decodedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "force-cache",
      next: { revalidate: 86400 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 404 또는 다른 에러 발생 시 기본 이미지 반환
      if (response.status === 404) {
        try {
          const defaultImagePath = join(
            process.cwd(),
            "public",
            "img",
            "dummyImg.png"
          );
          const defaultImageBuffer = await readFile(defaultImagePath);

          return new NextResponse(new Uint8Array(defaultImageBuffer), {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": cacheControl,
            },
          });
        } catch (fallbackError) {
          console.error("Failed to load default image:", fallbackError);
          return NextResponse.json(
            { error: "Failed to fetch image and default image" },
            { status: 500 }
          );
        }
      }
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    let contentType = response.headers.get("content-type") || "image/jpeg";

    // URL에서 확장자를 확인하여 Content-Type 추정
    const urlPath = new URL(decodedUrl).pathname.toLowerCase();
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
    ];
    const isImageExtension = imageExtensions.some((ext) =>
      urlPath.endsWith(ext)
    );

    // .bin 확장자도 이미지일 수 있으므로 실제 바이트 확인
    const isLikelyImage = isImageExtension || urlPath.endsWith(".bin");

    // Content-Type이 이미지가 아니지만 확장자가 이미지인 경우 Content-Type 추정
    if (!contentType.startsWith("image/") && isLikelyImage) {
      // 바이트 시그니처로 실제 이미지 타입 확인
      const bytes = new Uint8Array(imageBuffer);
      if (bytes.length >= 4) {
        // PNG: 89 50 4E 47
        if (
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47
        ) {
          contentType = "image/png";
        }
        // JPEG: FF D8 FF
        else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
          contentType = "image/jpeg";
        }
        // GIF: 47 49 46 38
        else if (
          bytes[0] === 0x47 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x38
        ) {
          contentType = "image/gif";
        }
        // WebP: RIFF...WEBP
        else if (
          bytes.length >= 12 &&
          bytes[0] === 0x52 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x46 &&
          bytes[8] === 0x57 &&
          bytes[9] === 0x45 &&
          bytes[10] === 0x42 &&
          bytes[11] === 0x50
        ) {
          contentType = "image/webp";
        }
        // 기본값으로 jpeg 사용
        else if (isLikelyImage) {
          contentType = "image/jpeg";
        }
      }
    }

    // Content-Type이 여전히 이미지가 아닌 경우 기본 이미지 반환
    if (!contentType.startsWith("image/")) {
      try {
        const defaultImagePath = join(
          process.cwd(),
          "public",
          "img",
          "dummyImg.png"
        );
        const defaultImageBuffer = await readFile(defaultImagePath);

        return new NextResponse(new Uint8Array(defaultImageBuffer), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": cacheControl,
          },
        });
      } catch (fallbackError) {
        console.error("Failed to load default image:", fallbackError);
        return NextResponse.json(
          { error: "Invalid image content type" },
          { status: 500 }
        );
      }
    }

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);

    // 에러 발생 시 기본 이미지 반환 시도
    try {
      const defaultImagePath = join(
        process.cwd(),
        "public",
        "img",
        "dummyImg.png"
      );
      const defaultImageBuffer = await readFile(defaultImagePath);

      return new NextResponse(new Uint8Array(defaultImageBuffer), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": cacheControl,
        },
      });
    } catch (fallbackError) {
      console.error("Failed to load default image:", fallbackError);
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 500 }
      );
    }
  }
}
