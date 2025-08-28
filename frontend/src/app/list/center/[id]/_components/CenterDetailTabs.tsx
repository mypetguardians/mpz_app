"use client";

import { TabButton } from "@/components/ui/TabButton";
import { Container } from "@/components/common/Container";
import { CenterAnimalsTab } from "./CenterAnimalsTab";
import { CenterInfoTab } from "./CenterInfoTab";
import type { TabType, CenterDetailProps } from "./types";
import type { RawAnimalResponse } from "@/types/animal";

interface CenterDetailTabsProps extends Omit<CenterDetailProps, "animals"> {
  activeTab: TabType;
  onTabChange: (value: TabType) => void;
  animals: RawAnimalResponse[];
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
            animals={animals.map((animal) => ({
              id: animal.id,
              name: animal.name || "",
              isFemale: animal.is_female,
              age: animal.age || 0,
              weight: animal.weight,
              color: animal.color,
              breed: animal.breed,
              description: animal.description,
              status: animal.status,
              waitingDays: animal.waiting_days,
              activityLevel: animal.activity_level?.toString() || null,
              sensitivity: animal.sensitivity?.toString() || null,
              sociability: animal.sociability?.toString() || null,
              separationAnxiety: animal.separation_anxiety?.toString() || null,
              specialNotes: animal.special_notes,
              healthNotes: animal.health_notes,
              basicTraining: animal.basic_training?.toString() || null,
              trainerComment: animal.trainer_comment,
              announceNumber: animal.announce_number,
              announcementDate: animal.announcement_date,
              admissionDate: animal.admission_date,
              foundLocation: animal.found_location,
              personality: animal.personality,
              megaphoneCount: animal.megaphone_count || 0,
              isMegaphoned: animal.is_megaphoned || false,
              centerId: animal.center_id,
              animalImages:
                animal.animal_images?.map((img) => ({
                  id: img.id,
                  imageUrl: img.image_url,
                  orderIndex: img.order_index,
                })) || null,
              createdAt: animal.created_at,
              updatedAt: animal.updated_at,
            }))}
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
