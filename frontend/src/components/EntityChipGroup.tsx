interface EntityChipGroupProps {
  title: string
  items: string[]
}

export function EntityChipGroup({ title, items }: EntityChipGroupProps) {
  return (
    <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">{title}</p>
        <span className="text-xs text-slate-500">{items.length || 'None'}</span>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="rounded-full border border-slate-500/10 bg-slate-900/80 px-3 py-1 text-xs text-slate-200">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-400">No signals detected.</p>
      )}
    </div>
  )
}
