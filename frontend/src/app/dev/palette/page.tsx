"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, MapPin, Bell,
} from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { BigButton } from "@/components/ui/BigButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { Chip } from "@/components/ui/Chip";
import { InfoCard } from "@/components/ui/InfoCard";
import { TabButton } from "@/components/ui/TabButton";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { SearchInput } from "@/components/ui/SearchInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CustomModal } from "@/components/ui/CustomModal";
import { AddButton } from "@/components/ui/AddButton";
import { SelectButton } from "@/components/ui/SelectButton";
import { DotProgressBar } from "@/components/ui/DotProgressBar";
import { LinearProgressBar } from "@/components/ui/LinearProgressBar";

const colors = [
  { name: "bk", value: "#1c1c1c", desc: "본문, 타이틀" },
  { name: "dg", value: "#595959", desc: "보조 텍스트 (진한)" },
  { name: "gr", value: "#8a8a8a", desc: "보조 텍스트 (옅은)" },
  { name: "lg", value: "#e3e3e3", desc: "보더, 구분선" },
  { name: "bg", value: "#f7f7f7", desc: "배경 (회색)" },
  { name: "wh", value: "#ffffff", desc: "배경 (흰색)" },
  { name: "brand", value: "#3E93FA", desc: "브랜드 메인" },
  { name: "brand-sub1", value: "#6BAEFF", desc: "브랜드 서브" },
  { name: "orange-100", value: "#FC6524", desc: "액센트 오렌지" },
  { name: "orange-50", value: "#FFF4E8", desc: "오렌지 배경" },
  { name: "error", value: "#FF4F6F", desc: "에러" },
  { name: "red", value: "#F31260", desc: "삭제, 위험" },
  { name: "green", value: "#00B506", desc: "성공" },
  { name: "yellow", value: "#FFC800", desc: "알림, 주의" },
];

const typography = [
  { level: "H2", cls: "text-xl font-bold", size: "20px", weight: "Bold", usage: "섹션 대제목" },
  { level: "H3", cls: "text-lg font-bold", size: "18px", weight: "Bold", usage: "핵심 헤드라인" },
  { level: "H4", cls: "text-base font-semibold", size: "16px", weight: "Semibold", usage: "섹션 타이틀" },
  { level: "H5", cls: "text-sm font-semibold", size: "14px", weight: "Semibold", usage: "소제목" },
  { level: "Body", cls: "text-sm font-normal", size: "14px", weight: "Regular", usage: "본문" },
  { level: "Body2", cls: "text-xs font-normal", size: "12px", weight: "Regular", usage: "보조, 캡션" },
  { level: "Caption", cls: "text-[11px] font-normal", size: "11px", weight: "Regular", usage: "주석" },
  { level: "Badge", cls: "text-[10px] font-medium", size: "10px", weight: "Medium", usage: "뱃지, 태그" },
];

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <>
      <section className="px-4">
        <h3 className="text-base font-semibold text-bk mb-1">{title}</h3>
        <p className="text-xs text-gr mb-4">{desc}</p>
        {children}
      </section>
      <div className="mx-4 border-b border-lg my-8" />
    </>
  );
}

export default function PalettePage() {
  const router = useRouter();

  // 인터랙션 상태
  const [inputVal, setInputVal] = useState("입력 테스트");
  const [searchVal, setSearchVal] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [activeTab, setActiveTab] = useState("tab1");
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedBtn, setSelectedBtn] = useState("A");
  const [progressStep, setProgressStep] = useState(2);
  const [progressPercent, setProgressPercent] = useState(60);
  const [miniActive, setMiniActive] = useState("filterOn");

  return (
    <Container className="min-h-screen pb-20">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={() => router.back()}
            />
            <h4 className="ml-2">디자인 팔레트</h4>
          </div>
        }
      />

      {/* ===== 컬러 ===== */}
      <Section title="컬러 시스템" desc="Tailwind 커스텀 색상">
        <div className="space-y-2">
          {colors.map((c) => (
            <div key={c.name} className="flex items-center">
              <div className="w-10 h-10 rounded-lg border border-lg shrink-0" style={{ backgroundColor: c.value }} />
              <div className="ml-3">
                <p className="text-sm font-medium text-bk">{c.name} <span className="text-gr font-normal ml-1">{c.value}</span></p>
                <p className="text-xs text-gr">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 컬러 투명도 ===== */}
      <Section title="컬러 투명도 조합" desc="상태별 배경+텍스트">
        <div className="space-y-2">
          {[
            { bg: "bg-brand/10", text: "text-brand", label: "brand/10", usage: "입양가능" },
            { bg: "bg-green/10", text: "text-green", label: "green/10", usage: "보호중" },
            { bg: "bg-orange-50", text: "text-orange-100", label: "orange-50", usage: "임시보호" },
            { bg: "bg-error/10", text: "text-error", label: "error/10", usage: "입양불가" },
            { bg: "bg-brand-op", text: "text-brand", label: "brand-op", usage: "선택 상태" },
          ].map((c) => (
            <div key={c.label} className="flex items-center">
              <span className={`${c.bg} ${c.text} text-xs font-medium px-3 py-1.5 rounded-full`}>{c.label}</span>
              <p className="text-xs text-gr ml-3">{c.usage}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 타이포그래피 ===== */}
      <Section title="타이포그래피" desc="Pretendard · 8단계">
        <div className="space-y-4">
          {typography.map((t) => (
            <div key={t.level}>
              <p className={`${t.cls} text-bk`}>{t.level} — 다람쥐 헌 쳇바퀴에 타고파</p>
              <p className="text-[11px] text-gr mt-0.5">{t.size} / {t.weight} · {t.usage}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== Border Radius ===== */}
      <Section title="Border Radius" desc="라운딩 규격">
        <div className="flex items-end">
          {[
            { r: "rounded-full", label: "full", px: "9999" },
            { r: "rounded-2xl", label: "2xl", px: "16" },
            { r: "rounded-xl", label: "xl", px: "12" },
            { r: "rounded-lg", label: "lg", px: "8" },
            { r: "rounded-md", label: "md", px: "6" },
          ].map((item, i) => (
            <div key={item.label} className={`text-center ${i > 0 ? "ml-4" : ""}`}>
              <div className={`w-12 h-12 bg-brand ${item.r}`} />
              <p className="text-[10px] text-gr mt-1">{item.label}</p>
              <p className="text-[10px] text-gr">{item.px}px</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 아이콘 사이즈 ===== */}
      <Section title="아이콘 사이즈" desc="IconButton size prop">
        <div className="flex items-end">
          {[
            { size: "iconS" as const, px: "16", icon: Heart },
            { size: "iconM" as const, px: "20", icon: Bell },
            { size: "iconL" as const, px: "24", icon: MapPin },
          ].map((item, i) => (
            <div key={item.size} className={`text-center ${i > 0 ? "ml-6" : ""}`}>
              <IconButton icon={({ size }) => <item.icon size={size} weight="bold" />} size={item.size} />
              <p className="text-[10px] text-gr mt-1">{item.size}</p>
              <p className="text-[10px] text-gr">{item.px}px</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== BigButton ===== */}
      <Section title="BigButton" desc="주요 액션 버튼 · 클릭 가능">
        <div className="space-y-3">
          <BigButton variant="primary" onClick={() => { setToastType("success"); setShowToast(true); }}>Primary (클릭해보세요)</BigButton>
          <BigButton variant="variant4" onClick={() => { setToastType("error"); setShowToast(true); }}>Variant 4</BigButton>
          <BigButton variant="variant3">Variant 3</BigButton>
          <BigButton variant="primary" disabled>Disabled</BigButton>
        </div>
      </Section>

      {/* ===== MiniButton ===== */}
      <Section title="MiniButton" desc="필터, 태그 · 클릭 시 상태 전환">
        <div className="flex flex-wrap">
          {["filterOn", "filterOff", "outline"].map((v, i) => (
            <MiniButton
              key={v}
              text={v}
              variant={miniActive === v ? "filterOn" : v as "filterOn" | "filterOff" | "outline"}
              onClick={() => setMiniActive(v)}
              className={i > 0 ? "ml-2" : ""}
            />
          ))}
          <MiniButton text="아이콘" variant="filterOff" leftIcon={<MapPin size={12} />} className="ml-2" />
        </div>
      </Section>

      {/* ===== Chip ===== */}
      <Section title="Chip" desc="상태 표시 칩">
        <div className="flex flex-wrap">
          {[
            { cls: "bg-green/10 text-green", label: "보호중" },
            { cls: "bg-brand/10 text-brand", label: "입양가능" },
            { cls: "bg-orange-50 text-orange-100", label: "임시보호" },
            { cls: "bg-error/10 text-error", label: "입양불가" },
            { cls: "bg-gray-100 text-dg", label: "입양완료" },
          ].map((c, i) => (
            <Chip key={c.label} className={`${c.cls} ${i > 0 ? "ml-2" : ""}`}>{c.label}</Chip>
          ))}
        </div>
      </Section>

      {/* ===== TabButton ===== */}
      <Section title="TabButton" desc="탭 전환 · 클릭 가능">
        <TabButton
          value={activeTab}
          tabs={[
            { label: "동물찾기", value: "tab1" },
            { label: "보호센터", value: "tab2" },
            { label: "커뮤니티", value: "tab3" },
          ]}
          variant="variant3"
          onValueChange={setActiveTab}
        />
        <p className="text-xs text-gr mt-2">선택: {activeTab}</p>
      </Section>

      {/* ===== SelectButton ===== */}
      <Section title="SelectButton" desc="선택 버튼 · 클릭 시 전환">
        <div className="flex flex-wrap">
          {["A", "B", "C"].map((v, i) => (
            <SelectButton
              key={v}
              variant="1"
              selected={selectedBtn === v}
              onClick={() => setSelectedBtn(v)}
              className={i > 0 ? "ml-2" : ""}
            >
              옵션 {v}
            </SelectButton>
          ))}
        </div>
      </Section>

      {/* ===== CustomInput ===== */}
      <Section title="CustomInput" desc="폼 입력 필드 · 입력 가능">
        <div className="space-y-3">
          <CustomInput variant="primary" label="기본 입력" placeholder="입력하세요" value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
          <CustomInput variant="primary" label="필수" placeholder="required" value="" onChange={() => {}} required />
          <CustomInput variant="primary" label="비활성" placeholder="disabled" value="수정 불가" onChange={() => {}} disabled />
          <CustomInput variant="primary" label="멀티라인" placeholder="여러 줄 입력" value="" onChange={() => {}} multiline rows={2} />
        </div>
      </Section>

      {/* ===== SearchInput ===== */}
      <Section title="SearchInput" desc="검색 입력 · 입력 가능">
        <SearchInput placeholder="검색어를 입력하세요" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} />
        {searchVal && <p className="text-xs text-gr mt-2">입력값: {searchVal}</p>}
      </Section>

      {/* ===== AddButton ===== */}
      <Section title="AddButton" desc="추가 버튼 (점선)">
        <AddButton onClick={() => { setToastType("success"); setShowToast(true); }}>항목 추가하기</AddButton>
      </Section>

      {/* ===== InfoCard ===== */}
      <Section title="InfoCard" desc="안내 카드">
        <InfoCard>안내 메시지입니다. 사용자에게 참고 정보를 전달할 때 사용합니다.</InfoCard>
      </Section>

      {/* ===== Progress ===== */}
      <Section title="DotProgressBar" desc="단계 인디케이터 · 클릭으로 단계 이동">
        <DotProgressBar currentStep={progressStep} totalSteps={5} />
        <div className="flex items-center mt-3">
          <MiniButton text="이전" variant="outline" onClick={() => setProgressStep(Math.max(1, progressStep - 1))} />
          <MiniButton text="다음" variant="filterOn" onClick={() => setProgressStep(Math.min(5, progressStep + 1))} className="ml-2" />
          <p className="text-xs text-gr ml-3">{progressStep} / 5</p>
        </div>
      </Section>

      <Section title="LinearProgressBar" desc="선형 프로그레스 · 클릭으로 조절">
        <LinearProgressBar value={progressPercent} />
        <div className="flex items-center mt-3">
          <MiniButton text="-20" variant="outline" onClick={() => setProgressPercent(Math.max(0, progressPercent - 20))} />
          <MiniButton text="+20" variant="filterOn" onClick={() => setProgressPercent(Math.min(100, progressPercent + 20))} className="ml-2" />
          <p className="text-xs text-gr ml-3">{progressPercent}%</p>
        </div>
      </Section>

      {/* ===== BottomSheet ===== */}
      <Section title="BottomSheet" desc="하단 시트 · 버튼으로 열기">
        <BigButton variant="primary" onClick={() => setShowBottomSheet(true)}>BottomSheet 열기</BigButton>
      </Section>

      {/* ===== CustomModal ===== */}
      <Section title="CustomModal" desc="모달 · 버튼으로 열기">
        <BigButton variant="variant4" onClick={() => setShowModal(true)}>Modal 열기</BigButton>
      </Section>

      {/* ===== Toast ===== */}
      <Section title="NotificationToast" desc="토스트 알림 · 위 버튼 클릭 시 표시">
        <div className="flex">
          <BigButton variant="primary" onClick={() => { setToastType("success"); setShowToast(true); }} className="flex-1">성공 토스트</BigButton>
          <BigButton variant="variant3" onClick={() => { setToastType("error"); setShowToast(true); }} className="flex-1 ml-2">에러 토스트</BigButton>
        </div>
      </Section>

      {/* ===== 텍스트 처리 ===== */}
      <Section title="텍스트 처리" desc="오버플로우, 말줄임">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gr mb-1">truncate (1줄)</p>
            <p className="text-sm text-bk truncate w-48">이것은 아주 긴 텍스트인데 한 줄로 잘립니다 말줄임표가 나옵니다</p>
          </div>
          <div>
            <p className="text-xs text-gr mb-1">line-clamp-2 (2줄)</p>
            <p className="text-sm text-bk line-clamp-2 w-48">이것은 아주 긴 텍스트인데 두 줄까지 보여주고 나머지는 잘립니다. 세 번째 줄부터는 보이지 않게 됩니다.</p>
          </div>
        </div>
      </Section>

      {/* ===== 간격 ===== */}
      <Section title="간격 규격" desc="여백 기준값">
        <div className="space-y-2 text-sm text-dg">
          <p><span className="text-gr inline-block w-20">px-4</span>좌우 패딩 (16px)</p>
          <p><span className="text-gr inline-block w-20">mt-5</span>섹션 간 간격 (20px)</p>
          <p><span className="text-gr inline-block w-20">mt-8</span>큰 섹션 구분 (32px)</p>
          <p><span className="text-gr inline-block w-20">space-y-3</span>폼 필드 간격 (12px)</p>
          <p><span className="text-gr inline-block w-20">mb-1</span>타이틀 → 설명 (4px)</p>
          <p><span className="text-gr inline-block w-20">mb-4</span>설명 → 컨텐츠 (16px)</p>
        </div>
      </Section>

      {/* ===== 스타일 규칙 ===== */}
      <section className="px-4 mb-8">
        <h3 className="text-base font-semibold text-bk mb-1">스타일 규칙</h3>
        <p className="text-xs text-gr mb-4">개발 시 준수사항</p>
        <div className="space-y-1.5 text-sm text-dg">
          <p>· flex gap 사용 금지 → margin 또는 space-y</p>
          <p>· grid gap은 사용 가능</p>
          <p>· 공통 컴포넌트 우선 사용</p>
          <p>· 모바일 퍼스트: max-width 420px</p>
          <p>· 폰트: Pretendard</p>
          <p>· border/radius 카드 래핑 최소화</p>
          <p>· UI 구성 전 이 팔레트 참고 필수</p>
        </div>
      </section>

      {/* ===== 인터랙션 오버레이 ===== */}
      <BottomSheet
        open={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        variant="primary"
        title="BottomSheet 예시"
        description="하단에서 올라오는 시트입니다."
        leftButtonText="취소"
        rightButtonText="확인"
        onLeftClick={() => setShowBottomSheet(false)}
        onRightClick={() => setShowBottomSheet(false)}
      />

      <CustomModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Modal 예시"
        description="중앙에 표시되는 모달입니다."
        variant="variant4"
        ctaText="확인"
        onCtaClick={() => setShowModal(false)}
      />

      {showToast && (
        <NotificationToast
          message={toastType === "success" ? "성공 메시지입니다." : "에러가 발생했습니다."}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </Container>
  );
}
