import { Banner } from "@/components/ui/Banner";

export function FooterSection() {
  return (
    <>
      <div className="px-4">
        <Banner variant="sub" />
      </div>

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
