"use client";

import { TabButton } from "@/components/ui/TabButton";
import { Container } from "@/components/common/Container";
import { CenterAnimalsTab } from "./CenterAnimalsTab";
import { CenterInfoTab } from "./CenterInfoTab";
import type { TabType, CenterDetailProps } from "./types";

interface CenterDetailTabsProps extends CenterDetailProps {
  activeTab: TabType;
  onTabChange: (value: TabType) => void;
}

export function CenterDetailTabs({
  activeTab,
  onTabChange,
  center,
  animals,
  animalsLoading,
}: CenterDetailTabsProps) {
  const tabs = [
    { label: "보호소 정보", value: "info" as TabType },
    { label: "보호 동물", value: "animals" as TabType },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <CenterInfoTab
            centerNumber={center.phoneNumber || undefined}
            location={center.location || undefined}
          />
        );
      case "animals":
        return (
          <CenterAnimalsTab
            animals={animals}
            isLoading={animalsLoading}
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
