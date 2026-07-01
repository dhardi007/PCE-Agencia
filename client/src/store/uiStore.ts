import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  theme: Theme;
  activeSection: string;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarMobile: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  setActiveSection: (section: string) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      theme: 'system',
      activeSection: 'overview',
      toasts: [],

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      toggleSidebarMobile: () => set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),
      setSidebarMobileOpen: (open: boolean) => set({ sidebarMobileOpen: open }),
      setTheme: (theme: Theme) => set({ theme }),
      setActiveSection: (section: string) => set({ activeSection: section }),

      addToast: (message: string, type = 'info') =>
        set((state) => ({
          toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }],
        })),
      removeToast: (id: string) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    { name: 'pce-ui', partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, theme: state.theme }) }
  )
);