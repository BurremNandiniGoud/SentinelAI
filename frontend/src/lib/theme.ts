import { create } from 'zustand'

export type ThemeMode = 'dark' | 'light'

interface ThemeState {
  mode: ThemeMode
  toggle: () => void
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'light') {
    root.classList.add('light')
    root.style.colorScheme = 'light'
  } else {
    root.classList.remove('light')
    root.style.colorScheme = 'dark'
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark',
  toggle: () =>
    set((state) => {
      const next = state.mode === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { mode: next }
    }),
}))
