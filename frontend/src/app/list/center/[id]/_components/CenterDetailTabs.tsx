"use client";

import { TabButton } from "@/components/ui/TabButton";
import { Container } from "@/components/common/Container";
import { CenterAnimalsTab } from "./CenterAnimalsTab";
import { CenterInfoTab } from "./CenterInfoTab";
import type { TabType, CenterDetailProps } from "./types";

interface CenterDetailTabsProps
  extends Omit<CenterDetailProps, "animals" | "animalsLoading"> {
  activeTab: TabType;
  onTabChange: (value: TabType) => void;
}

export function CenterDetailTabs({
  activeTab,
  onTabChange,
  center,
}: CenterDetailTabsProps) {
  const tabs = [
    { label: "보호 동물", value: "animals" as TabType },
    { label: "보호센터 정보", value: "info" as TabType },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <CenterInfoTab
            centerNumber={center.phoneNumber || undefined}
            location={center.location || undefined}
            isPublicData={!center.userId}
            isSubscribed={center.isSubscriber}
            adoptionProcedure={center.adoptionProcedure || undefined}
            adoptionGuidelines={center.adoptionGuidelines || undefined}
            hasMonitoring={center.hasMonitoring}
            hasVolunteer={center.hasVolunteer}
            hasFosterCare={center.hasFosterCare}
          />
        );
      case "animals":
        return (
          <CenterAnimalsTab
            showFilters={true}
            centerId={center.id}
            variant="detailed"
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Container className="mb-4 cursor-pointer">
        <TabButton
          value={activeTab}
          tabs={tabs}
          variant="variant3"
          useLinks={false}
          onValueChange={(value) => onTabChange(value as TabType)}
        />
      </Container>

      {renderTabContent()}
    </>
  );
}
