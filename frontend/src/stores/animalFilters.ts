import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FilterState } from "@/lib/filter-utils";

type AnimalFilterStore = {
  filters: FilterState;
  searchValue: string;
  setFilters: (partial: Partial<FilterState>) => void;
  setSearchValue: (value: string) => void;
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
      searchValue: "",
      setFilters: (partial) => {
        const next = { ...get().filters, ...partial };
        set({ filters: next });
      },
      setSearchValue: (value) => set({ searchValue: value }),
      reset: () => set({ filters: initialFilters, searchValue: "" }),
    }),
    {
      name: "animalFilters",
      version: 2,
      partialize: (state) => ({ filters: state.filters, searchValue: state.searchValue }),
    }
  )
);
