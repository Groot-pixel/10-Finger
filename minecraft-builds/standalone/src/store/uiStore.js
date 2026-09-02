import { create } from 'zustand';

let toastId = 0;
const THEME_KEY = 'craftguide_theme';

export const useUiStore = create((set, get) => ({
  theme: localStorage.getItem(THEME_KEY) || 'dark',
  toasts: [],
  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
  pushToast: (message, type = 'info') => {
    const id = ++toastId;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 3500);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
