import { create } from "zustand";

interface HomeLocationState {
  selectedLocation: string;
  userGpsLocation: string;
  setSelectedLocation: (location: string) => void;
  setUserGpsLocation: (location: string) => void;
  reset: () => void;
}

export const useHomeLocationStore = create<HomeLocationState>((set) => ({
  selectedLocation: "",
  userGpsLocation: "",
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  setUserGpsLocation: (location) => set({ userGpsLocation: location }),
  reset: () => set({ selectedLocation: "", userGpsLocation: "" }),
}));
