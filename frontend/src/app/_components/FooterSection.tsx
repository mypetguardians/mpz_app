import { Banner } from "@/components/ui/Banner";

export function FooterSection() {
  return (
    <>
      <div className="px-4 pb-8">
        <Banner variant="sub" />
      </div>

      {/* Footer 섹션 */}
      <footer className="bg-bg pb-20 pt-6 px-4">
        <div className="text-[10px] text-gr leading-[18px]">
          <p className="font-medium text-dg mb-1">(주)마이펫가디언즈</p>
          <p>사업자등록번호 246-81-03596 | 대표 유가희</p>
          <p>경기도 안산시 상록구 중보로 27, 401-1449호</p>
          <p className="mt-2 text-[9px]">© {new Date().getFullYear()} MyPetGuardians. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
