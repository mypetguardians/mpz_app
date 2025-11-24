import { create } from "zustand";

interface AnimalFilterOverlayState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useAnimalFilterOverlayStore = create<AnimalFilterOverlayState>(
  (set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
  })
);
