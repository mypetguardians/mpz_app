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
  isPublicData?: boolean;
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
  hasMonitoring,
  hasVolunteer,
  hasFosterCare,
  isSubscribed,
  isPublicData,
  className = "",
}: CenterInfoTabProps) {
  const adoptionItems: InfoItem[] = [
    { label: "전화번호", value: centerNumber || "" },
    ...(isPublicData
      ? [{ label: "위치", value: location || "" }]
      : [
          {
            label: "위치",
            value: "관리자를 통해 안내받으실 수 있습니다.",
          },
        ]),
  ].filter((item) => item.value);

  const adoptionDetailItems: InfoItem[] = [
    { label: "입양 절차", value: adoptionProcedure || "" },
    {
      label: "모니터링",
      value: hasMonitoring
        ? "입양 후 모니터링 진행"
        : "입양 후 모니터링 미진행",
    },
    { label: "봉사", value: hasVolunteer ? "가능" : "불가능" },
    {
      label: "임시보호",
      value: hasFosterCare ? "가능" : "불가능",
    },
  ].filter((detailItem) => detailItem.value);

  return (
    <div className={`flex flex-col gap-2 mx-4 ${className}`}>
      <div className="w-full">
        <table className="w-full">
          <tbody className="flex flex-col gap-2 items-start">
            {adoptionItems.map((item) => (
              <tr key={item.label}>
                <td className="h6 text-gr w-32 text-left align-top">
                  {item.label}
                </td>
                <td className="body text-bk align-top">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isPublicData && <KakaoMap address={location || ""} />}
      {isSubscribed && (
        <>
          <div className="border-t border-bg my-2" />
          <h3>입양 정보</h3>
          <table className="w-full">
            <tbody className="flex flex-col gap-2 items-start">
              {adoptionDetailItems.map((item) => (
                <tr key={item.label}>
                  <td className="h6 text-gr w-32 text-left align-top">
                    {item.label}
                  </td>
                  <td className="body text-bk align-top">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
