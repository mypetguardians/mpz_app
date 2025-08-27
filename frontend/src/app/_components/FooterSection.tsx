import { MainSection } from "@/components/common/MainSection";

export function FooterSection() {
  return (
    <>
      <MainSection>
        <div className="flex h-20 bg-brand-light/50 py-[27px] px-5 justify-between items-center rounded-lg">
          {/* @TODO 최고관리자 생성시 추가 */}
          <h5 className="text-wh">쇼핑몰 연계 배너</h5>
        </div>
      </MainSection>

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
