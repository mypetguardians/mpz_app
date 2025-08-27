"use client";

import { KakaoMap } from "@/components/ui/KakaoMap";

interface CenterInfoTabProps {
  centerNumber?: string;
  location?: string;
  className?: string;
}

interface InfoItem {
  label: string;
  value: string;
}

export function CenterInfoTab({
  centerNumber,
  location,
  className = "",
}: CenterInfoTabProps) {
  const infoItems: InfoItem[] = [
    { label: "전화번호", value: centerNumber || "" },
    { label: "위치", value: location || "" },
  ].filter((item) => item.value);

  const renderInfoTable = () => (
    <div className="w-full">
      <table className="w-full">
        <tbody className="flex flex-col gap-2">
          {infoItems.map((item) => (
            <tr key={item.label}>
              <td className="h6 text-gr w-24 text-left">{item.label}</td>
              <td className="body text-bk">{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={`flex flex-col gap-4 mx-4 ${className}`}>
      {renderInfoTable()}
      <KakaoMap address={location || ""} />
    </div>
  );
}
