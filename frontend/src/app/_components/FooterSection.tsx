import { useGetBanners } from "@/hooks/query/useGetBanners";
import Image from "next/image";

export function FooterSection() {
  const { data: banners, isLoading } = useGetBanners({ type: "sub" });

  // 배너가 없을 때 기본값 설정
  const defaultBanner = {
    title: "마이펫가디언즈",
    alt: "마이펫가디언즈 배너",
    link_url: "/", // 기본 링크 (홈으로)
  };

  const targetBanner = banners?.data?.[0] || defaultBanner;

  return (
    <>
      {(isLoading || (banners?.data && banners.data.length > 0)) && (
        <div className="px-4 pb-5">
          <div className="relative w-full h-20 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full bg-gray-200 animate-pulse" />
            ) : (
              <>
                <Image
                  // TODO: 실제 배너 이미지로 변경 필요
                  src={"/img/banner.jpg"}
                  alt={targetBanner.alt}
                  fill
                  className="object-cover"
                  onClick={() => {
                    if (targetBanner.link_url) {
                      window.open(targetBanner.link_url, "_blank");
                    }
                  }}
                />
                <div className="absolute inset-0 flex items-center px-5">
                  <span className="text-sm text-white font-medium">
                    {targetBanner.title}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer 섹션 */}
      <div className="bg-bg pb-20">
        <h6 className="text-gr text-[10px] font-light px-4 py-3">
          (주)마이펫가디언즈 사업자 등록번호 : 246-81-03596 <br />
          CEO : 유가희 <br />
          주소 : 경기도 안산시 상록구 중보로 27, 401-1449호(이동, 월드프라자)
        </h6>
      </div>
    </>
  );
}
