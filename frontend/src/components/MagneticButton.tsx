import { motion, type HTMLMotionProps } from 'framer-motion'
import { type ReactNode } from 'react'

interface MagneticButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  children: ReactNode
  className?: string
}

export function MagneticButton({ children, className = '', ...props }: MagneticButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className={
        'inline-flex items-center justify-center rounded-lg border border-slate-500/10 bg-ink-800 px-5 py-3 text-sm font-semibold text-parchment shadow-soft outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 hover:bg-ink-700 disabled:pointer-events-none disabled:opacity-60 ' +
        className
      }
      {...props}
    >
      {children}
    </motion.button>
  )
}
