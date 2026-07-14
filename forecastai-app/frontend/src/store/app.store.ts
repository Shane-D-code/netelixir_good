import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  theme: 'dark';
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isMobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      theme: 'dark',
    }),
    {
      name: 'forecastai-nav',
      partialize: () => ({}),
    }
  )
);
