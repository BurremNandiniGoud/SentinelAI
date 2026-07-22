import { motion } from 'framer-motion'

interface RiskGaugeCardProps {
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  fraudProbability: number
  suggestedAction: string
}

const levelStyles = {
  LOW: 'bg-forest text-forest',
  MEDIUM: 'bg-ochre text-ochre',
  HIGH: 'bg-oxblood text-oxblood',
}

export function RiskGaugeCard({ threatLevel, riskScore, fraudProbability, suggestedAction }: RiskGaugeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-2xl border border-slate-500/10 bg-ink-800 p-6 shadow-soft"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Threat level</p>
          <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${levelStyles[threatLevel]}`}>
            {threatLevel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Risk score</p>
          <p className="text-3xl font-semibold text-parchment">{riskScore}</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="rounded-2xl bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Fraud probability</p>
          <p className="mt-2 text-3xl font-semibold text-parchment">{Math.round(fraudProbability * 100)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-500/10 bg-ink-900/70 p-4 text-sm text-slate-300">
          {suggestedAction}
        </div>
      </div>
    </motion.div>
  )
}
