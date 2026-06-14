import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PageName } from '../types';

interface AppState {
  currentPage: PageName;
  pageHistory: PageName[];
  setCurrentPage: (page: PageName) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  theme: 'dark';
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      pageHistory: [],
      setCurrentPage: (page) =>
        set((state) => ({
          pageHistory: state.currentPage !== page
            ? [...state.pageHistory, state.currentPage]
            : state.pageHistory,
          currentPage: page,
        })),
      goBack: () => {
        const state = get();
        if (state.pageHistory.length === 0) return;
        const prev = state.pageHistory[state.pageHistory.length - 1];
        set({
          currentPage: prev,
          pageHistory: state.pageHistory.slice(0, -1),
        });
      },
      canGoBack: () => get().pageHistory.length > 0,
      isMobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      theme: 'dark',
    }),
    {
      name: 'forecastai-nav',
      partialize: (state) => ({
        currentPage: state.currentPage,
        pageHistory: state.pageHistory,
      }),
    }
  )
);
