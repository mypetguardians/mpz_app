import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isProd =
    process.env.NEXT_PUBLIC_API_BASE_URL?.includes("api.mpz.kr") ?? true;

  if (!isProd) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dev/", "/centerpage/", "/oauth/", "/adoption/verification/"],
    },
    sitemap: "https://mpz.kr/sitemap.xml",
  };
}
