import { redirect } from "next/navigation";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  // prod 환경에서는 접근 차단
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_API_BASE_URL?.includes("api.mpz.kr")) {
    redirect("/");
  }

  return <>{children}</>;
}
