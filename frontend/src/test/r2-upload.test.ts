import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { validateImageFile, generateSafeFileName, extractR2KeyFromUrl } from "@/lib/r2-utils";

describe("R2 Upload Utils", () => {
  describe("validateImageFile", () => {
    it("유효한 이미지 파일을 허용해야 한다", () => {
      const mockFile = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      Object.defineProperty(mockFile, "size", { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(mockFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("크기가 너무 큰 파일을 거부해야 한다", () => {
      const mockFile = new File(["test content"], "large.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      Object.defineProperty(mockFile, "size", { value: 15 * 1024 * 1024 }); // 15MB

      const result = validateImageFile(mockFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("파일 크기가 너무 큽니다");
    });

    it("지원하지 않는 파일 형식을 거부해야 한다", () => {
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
        lastModified: Date.now(),
      });
      Object.defineProperty(mockFile, "size", { value: 1024 });

      const result = validateImageFile(mockFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("지원하지 않는 파일 형식");
    });

    it("악성 파일명을 거부해야 한다", () => {
      const mockFile = new File(["test content"], "../../../etc/passwd", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      Object.defineProperty(mockFile, "size", { value: 1024 });

      const result = validateImageFile(mockFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("부적절한 문자");
    });
  });

  describe("generateSafeFileName", () => {
    it("안전한 파일명을 생성해야 한다", () => {
      const originalName = "테스트 이미지.jpg";
      const prefix = "animals/123";
      
      const result = generateSafeFileName(originalName, prefix);
      
      expect(result).toMatch(/^animals\/123\/\d+-[a-f0-9-]+-.*\.jpg$/);
      expect(result).not.toContain("테스트");
      expect(result).toContain("_"); // 한글이 underscore로 변환됨
    });

    it("prefix 없이도 작동해야 한다", () => {
      const originalName = "image.png";
      
      const result = generateSafeFileName(originalName);
      
      expect(result).toMatch(/^\d+-[a-f0-9-]+-image\.png$/);
      expect(result).not.toContain("/");
    });

    it("긴 파일명을 제한해야 한다", () => {
      const longName = "a".repeat(100) + ".jpg";
      
      const result = generateSafeFileName(longName);
      
      // 전체 파일명에서 확장자를 제외한 부분이 50자 이내여야 함
      const nameWithoutExtension = result.split(".")[0];
      const actualNamePart = nameWithoutExtension.split("-").slice(2).join("-"); // timestamp와 uuid 제거
      expect(actualNamePart.length).toBeLessThanOrEqual(50);
    });
  });

  describe("extractR2KeyFromUrl", () => {
    it("유효한 URL에서 키를 추출해야 한다", () => {
      const url = "https://images.mpz.app/animals/123/1704067200000-a1b2c3d4-photo.jpg";
      
      const result = extractR2KeyFromUrl(url);
      
      expect(result).toBe("animals/123/1704067200000-a1b2c3d4-photo.jpg");
    });

    it("잘못된 URL에서도 fallback이 작동해야 한다", () => {
      const invalidUrl = "not-a-valid-url";
      
      const result = extractR2KeyFromUrl(invalidUrl);
      
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("경로가 없는 URL을 처리해야 한다", () => {
      const url = "https://images.mpz.app/";
      
      const result = extractR2KeyFromUrl(url);
      
      expect(result).toBe("");
    });
  });
});

describe("R2 Integration Tests", () => {
  // 실제 R2 연결이 필요한 통합 테스트들
  // 현재는 스킵하고 향후 CI/CD에서 실행
  
  it.skip("실제 R2 버킷에 파일 업로드 테스트", async () => {
    // TODO: 실제 R2 환경에서 테스트
  });

  it.skip("R2 헬스체크 테스트", async () => {
    // TODO: 실제 R2 환경에서 테스트
  });
});
