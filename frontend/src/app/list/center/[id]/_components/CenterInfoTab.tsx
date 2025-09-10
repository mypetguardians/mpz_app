"use client";

import { KakaoMap } from "@/components/ui/KakaoMap";

interface CenterInfoTabProps {
  centerNumber?: string;
  location?: string;
  adoptionProcedure?: string;
  adoptionGuidelines?: string;
  hasMonitoring?: boolean;
  hasVolunteer?: boolean;
  hasFosterCare?: boolean;
  isSubscribed?: boolean;
  className?: string;
}

interface InfoItem {
  label: string;
  value: string;
}

export function CenterInfoTab({
  centerNumber,
  location,
  adoptionProcedure,
  adoptionGuidelines,
  hasMonitoring,
  hasVolunteer,
  hasFosterCare,
  isSubscribed,
  className = "",
}: CenterInfoTabProps) {
  const adoptionItems: InfoItem[] = [
    { label: "전화번호", value: centerNumber || "" },
    { label: "위치", value: location || "" },
  ].filter((item) => item.value);

  const adoptionDetailItems: InfoItem[] = [
    { label: "입양 절차", value: adoptionProcedure || "" },
    { label: "입양 가이드라인", value: adoptionGuidelines || "" },
    {
      label: "모니터링",
      value: hasMonitoring ? "모니터링 필수" : "모니터링 안 함",
    },
    { label: "봉사", value: hasVolunteer ? "봉사 필수" : "봉사 안 함" },
    {
      label: "입양 보호",
      value: hasFosterCare ? "입양 보호 필수" : "입양 보호 안 함",
    },
  ].filter((detailItem) => detailItem.value);

  return (
    <div className={`flex flex-col gap-4 mx-4 ${className}`}>
      <div className="w-full">
        <table className="w-full">
          <tbody className="flex flex-col gap-2">
            {adoptionItems.map((item) => (
              <tr key={item.label}>
                <td className="h6 text-gr w-24 text-left">{item.label}</td>
                <td className="body text-bk">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <KakaoMap address={location || ""} />
      {isSubscribed && (
        <>
          <div className="border-t border-bg my-3.5" />
          <h3>입양 정보</h3>
          <table className="w-full">
            <tbody className="flex flex-col gap-2">
              {adoptionDetailItems.map((item) => (
                <tr key={item.label}>
                  <td className="h6 text-gr w-24 text-left">{item.label}</td>
                  <td className="body text-bk">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
