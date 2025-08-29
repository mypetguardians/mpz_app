import { MainSection } from "@/components/common/MainSection";
import { useGetBanners } from "@/hooks/query/useGetBanners";
import Image from "next/image";

export function FooterSection() {
  const { data: banners, isLoading } = useGetBanners({ type: "main" });

  return (
    <>
      {(isLoading || (banners?.data && banners.data.length > 0)) && (
        <MainSection>
          <div className="flex h-20 py-[27px] px-5 justify-between items-center rounded-lg">
            {isLoading ? (
              ""
            ) : (
              <div className="flex gap-2">
                {banners?.data.slice(0, 3).map((banner) => (
                  <div key={banner.id} className="flex items-center gap-2">
                    <Image
                      src={banner.image_url}
                      alt={banner.alt}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded object-cover"
                    />
                    <span className="text-sm text-white">{banner.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MainSection>
      )}

      {/* Footer 섹션 */}
      <MainSection>
        <div>
          <h6>
            footer footer footer footer footer footer footer footer footer
          </h6>
        </div>
      </MainSection>
    </>
  );
}
