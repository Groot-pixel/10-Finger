import { create } from 'zustand';
import { persist } from 'zustand/middleware';

let toastId = 0;

export const useUiStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      toasts: [],
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      pushToast: (message, type = 'info') => {
        const id = ++toastId;
        set({ toasts: [...get().toasts, { id, message, type }] });
        setTimeout(() => {
          set({ toasts: get().toasts.filter((t) => t.id !== id) });
        }, 3500);
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    { name: 'craftguide-ui', partialize: (state) => ({ theme: state.theme }) },
  ),
);
