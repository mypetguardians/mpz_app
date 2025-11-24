import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FilterState } from "@/lib/filter-utils";

type AnimalFilterStore = {
  filters: FilterState;
  setFilters: (partial: Partial<FilterState>) => void;
  reset: () => void;
};

const initialFilters: FilterState = {
  breed: "",
  weights: [],
  regions: [],
  ages: [],
  genders: [],
  protectionStatus: [],
  expertOpinion: [],
};

export const useAnimalFiltersStore = create<AnimalFilterStore>()(
  persist(
    (set, get) => ({
      filters: initialFilters,
      setFilters: (partial) => {
        const next = { ...get().filters, ...partial };
        set({ filters: next });
      },
      reset: () => set({ filters: initialFilters }),
    }),
    {
      name: "animalFilters",
      version: 1,
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);
