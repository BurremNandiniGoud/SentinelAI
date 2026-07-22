interface ScoreCompareBarProps {
  ruleScore: number
  mlScore: number
}

export function ScoreCompareBar({ ruleScore, mlScore }: ScoreCompareBarProps) {
  return (
    <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-4">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
        Rule vs ML score
      </p>
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Rule score</span>
            <span>{Math.round(ruleScore * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-900/60">
            <div className="h-full rounded-full bg-slate-500" style={{ width: `${Math.round(ruleScore * 100)}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>ML score</span>
            <span>{Math.round(mlScore * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-900/60">
            <div className="h-full rounded-full bg-brass" style={{ width: `${Math.round(mlScore * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
