import { BrowserRouter, NavLink, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Home } from './pages/Home'
import { AnimatedDashboard } from './pages/AnimatedDashboard'
import { ScanCurrency } from './pages/ScanCurrency'
import { CheckMessage } from './pages/CheckMessage'
import { Analytics } from './pages/Analytics'
import { ThemeToggle } from './components/ThemeToggle'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Currency', path: '/scan-currency' },
  { label: 'Messages', path: '/check-message' },
  { label: 'Analytics', path: '/analytics' },
]

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<AnimatedDashboard />} />
          <Route path="/scan-currency" element={<ScanCurrency />} />
          <Route path="/check-message" element={<CheckMessage />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function AppLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen text-primary" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      {!isHome && (
        <header className="sticky top-0 z-50 border-b border-surface bg-surface/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <NavLink
                to="/"
                className="text-sm font-semibold tracking-[0.3em] uppercase hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-accent)' }}
              >
                SentinelAI
              </NavLink>
            </div>
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.slice(1).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-lg px-3.5 py-2 text-xs font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-secondary hover:text-primary hover:bg-tertiary'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: `${getAccentColor()}15`, color: 'var(--color-accent)' }
                      : { color: 'var(--color-text-secondary)' }
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <nav className="flex sm:hidden items-center gap-1">
                {navLinks.slice(1, 4).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all duration-300 ${
                        isActive ? 'bg-accent/10 text-accent' : 'text-secondary'
                      }`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? { backgroundColor: `${getAccentColor()}15`, color: 'var(--color-accent)' }
                        : { color: 'var(--color-text-secondary)' }
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}
      <AnimatedRoutes />
    </div>
  )
}

// Helper to get the current accent color from CSS variables
function getAccentColor(): string {
  if (typeof document !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#A9812F'
  }
  return '#A9812F'
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
