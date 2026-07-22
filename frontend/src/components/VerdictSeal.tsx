import { motion } from 'framer-motion'

interface VerdictSealProps {
  verdict: 'REAL' | 'FAKE' | 'NO NOTE'
  confidence: number
  recommendation: string
}

const verdictStyles = {
  REAL: 'border-forest bg-forest/10 text-forest',
  FAKE: 'border-oxblood bg-oxblood/10 text-oxblood',
  'NO NOTE': 'border-slate-500 bg-slate-500/10 text-slate-200',
}

export function VerdictSeal({ verdict, confidence, recommendation }: VerdictSealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.36, ease: 'easeOut' }}
      className="rounded-2xl border p-6 shadow-soft"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.34em] text-slate-400">Verdict</span>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${verdictStyles[verdict]}`}>{verdict}</span>
      </div>
      <div className="mb-4">
        <h3 className="text-3xl font-semibold leading-none text-parchment">{verdict}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">Confidence {confidence.toFixed(1)}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-700/40">
        <div
          className={`h-full rounded-full ${verdictStyles[verdict]}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{recommendation}</p>
    </motion.div>
  )
}
