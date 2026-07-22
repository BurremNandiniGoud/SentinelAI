import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../lib/theme'

export function ThemeToggle() {
  const toggle = useThemeStore((state) => state.toggle)
  const mode = useThemeStore((state) => state.mode)

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-500/10 bg-ink-800 text-slate-100 transition hover:border-brass hover:text-parchment focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
    >
      {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
