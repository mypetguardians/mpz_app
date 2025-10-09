import React from "react";
import { PetCard } from "@/components/ui/PetCard";
import type { RawAnimalResponse } from "@/types/animal";

interface RelatedAnimalsProps {
  pets: RawAnimalResponse[];
  location: string;
  className?: string;
}

export function RelatedAnimals({
  pets,
  location,
  className,
}: RelatedAnimalsProps) {
  return (
    <div className={`mx-4 my-3 flex flex-col gap-4 ${className}`}>
      <h2 className="text-bk">{location}의 다른 아이들</h2>
      {pets.length === 0 ? (
        <div className="text-gr text-md">가까운 동물이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {pets.slice(0, 6).map((pet) => (
            <div key={pet.id} className="flex-shrink-0">
              <PetCard
                pet={{
                  id: pet.id,
                  name: pet.name || "",
                  breed: pet.breed || "",
                  isFemale: pet.is_female,
                  protection_status: pet.protection_status,
                  adoption_status: pet.adoption_status,
                  centerId: pet.center_id,
                  animalImages:
                    pet.animal_images?.map((img) => ({
                      id: img.id,
                      imageUrl: img.image_url,
                      orderIndex: img.order_index,
                    })) || [],
                  foundLocation: pet.found_location || "",
                  admissionDate: pet.admission_date,
                  waitingDays: pet.waiting_days,
                }}
                variant="variant3"
                imageSize="full"
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
