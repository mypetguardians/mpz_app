import React from "react";
import { PetCard } from "./PetCard";
import type { AnimalResponseSchema } from "@/server/openapi/routes/animal";
import { z } from "zod";

type Animal = z.infer<typeof AnimalResponseSchema>;

interface RelatedAnimalsProps {
  pets: Animal[];
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
      <h2 className="text-bk">{location}에 있는 다른 아이들</h2>
      {pets.length === 0 ? (
        <div className="text-gr text-md">가까운 동물이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {pets.slice(0, 6).map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              variant="variant3"
              className="w-full"
            />
          ))}
        </div>
      )}
    </div>
  );
}
