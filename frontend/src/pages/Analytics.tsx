import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, PieChart, Download, Trash2, Search,
  Filter, RotateCcw, Activity, Clock,
  AlertTriangle, CheckCircle, Scan, MessageSquare, X,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { MagneticButton } from '../components/MagneticButton'
import { getScanHistory, clearScanHistory, exportHistoryCSV, exportHistoryJSON, getAnalyticsSummary } from '../lib/storage'
import type { StoredScan } from '../lib/storage'

export function Analytics() {
  const [history, setHistory] = useState<StoredScan[]>(() => getScanHistory())
  const [filter, setFilter] = useState<'all' | 'currency' | 'message'>('all')
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const summary = useMemo(() => getAnalyticsSummary(), [history])

  const filteredHistory = useMemo(() => {
    let items = [...history]
    if (filter !== 'all') {
      items = items.filter((s) => s.scan_type === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((s) =>
        s.verdict?.toLowerCase().includes(q) ||
        s.threat_level?.toLowerCase().includes(q) ||
        s.source?.toLowerCase().includes(q) ||
        s.scan_type?.toLowerCase().includes(q)
      )
    }
    items.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return sortDir === 'desc' ? diff : -diff
    })
    return items
  }, [history, filter, search, sortDir])

  const refreshHistory = useCallback(() => {
    setHistory(getScanHistory())
  }, [])

  const handleClear = useCallback(() => {
    clearScanHistory()
    setHistory([])
    setShowClearConfirm(false)
  }, [])

  const downloadCSV = useCallback(() => {
    const csv = exportHistoryCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sentinelai-history.csv'; a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadJSON = useCallback(() => {
    const json = exportHistoryJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sentinelai-history.json'; a.click()
    URL.revokeObjectURL(url)
  }, [])

  // Chart data
  const threatDistData = useMemo(() => [
    { name: 'LOW', value: summary.lowCount, color: '#1F6F54' },
    { name: 'MEDIUM', value: summary.mediumCount, color: '#B8862E' },
    { name: 'HIGH', value: summary.highCount, color: '#7A1F2B' },
  ].filter((d) => d.value > 0), [summary])

  const currencyDistData = useMemo(() => [
    { name: 'REAL', value: summary.realCount, color: '#1F6F54' },
    { name: 'FAKE', value: summary.fakeCount, color: '#7A1F2B' },
  ].filter((d) => d.value > 0), [summary])

  const dailyChartData = useMemo(() => {
    return Object.entries(summary.dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([day, stats]) => ({
        day: day.slice(5),
        Currency: stats.currency,
        Message: stats.message,
        Real: stats.real,
        Fake: stats.fake,
      }))
  }, [summary])

  const scanTypeDistData = useMemo(() => [
    { name: 'Currency', value: summary.currencyScans, color: '#A9812F' },
    { name: 'Message', value: summary.messageScans, color: '#3B5166' },
  ].filter((d) => d.value > 0), [summary])

  return (
    <div className="min-h-screen bg-ink-900 text-parchment">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment">Analytics & History</h1>
            <p className="mt-1 text-sm text-slate-400">{summary.total} total scans recorded across all detection tools.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MagneticButton onClick={downloadCSV} className="gap-2 text-sm">
              <Download size={15} /> Export CSV
            </MagneticButton>
            <MagneticButton onClick={downloadJSON} className="gap-2 text-sm border-slate-500/20 bg-transparent text-slate-400 hover:text-parchment">
              <Download size={15} /> Export JSON
            </MagneticButton>
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-oxblood">Confirm?</span>
                <button onClick={handleClear} className="rounded-lg bg-oxblood px-3 py-1.5 text-xs font-semibold text-white">Yes, clear</button>
                <button onClick={() => setShowClearConfirm(false)} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              </div>
            ) : (
              <MagneticButton onClick={() => setShowClearConfirm(true)} className="gap-2 text-sm text-oxblood border-oxblood/20 bg-transparent hover:bg-oxblood/10">
                <Trash2 size={15} /> Clear History
              </MagneticButton>
            )}
          </div>
        </motion.div>

        {/* Summary cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Total Scans', value: summary.total, icon: Activity, color: 'text-brass' },
            { label: 'Currency', value: summary.currencyScans, icon: Scan, color: 'text-brass' },
            { label: 'Messages', value: summary.messageScans, icon: MessageSquare, color: 'text-brass' },
            { label: 'REAL Verdicts', value: summary.realCount, icon: CheckCircle, color: 'text-forest' },
            { label: 'HIGH Risk', value: summary.highCount, icon: AlertTriangle, color: 'text-oxblood' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{card.label}</span>
                <card.icon size={16} className={card.color} />
              </div>
              <p className="font-mono text-2xl font-semibold text-parchment">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Daily activity area chart */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-parchment">Daily Activity</h3>
                <p className="text-xs text-slate-500 mt-1">Scan volume over time</p>
              </div>
              <BarChart3 size={16} className="text-brass" />
            </div>
            {dailyChartData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-slate-500">No data yet</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChartData}>
                    <defs>
                      <linearGradient id="currencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A9812F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#A9812F" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="messageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B5166" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B5166" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,81,102,0.12)" />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#151B26', borderRadius: 12, border: '1px solid rgba(59,81,102,0.2)', color: '#F3EFE6' }}
                    />
                    <Area type="monotone" dataKey="Currency" stroke="#A9812F" fill="url(#currencyGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Message" stroke="#3B5166" fill="url(#messageGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Threat distribution pie */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-parchment">Threat Distribution</h3>
                <p className="text-xs text-slate-500 mt-1">Message threat level breakdown</p>
              </div>
              <PieChart size={16} className="text-brass" />
            </div>
            {threatDistData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-slate-500">No message scans yet</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={threatDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {threatDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#151B26', borderRadius: 12, border: '1px solid rgba(59,81,102,0.2)', color: '#F3EFE6' }}
                    />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Currency distribution bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-parchment">Currency Verdicts</h3>
                <p className="text-xs text-slate-500 mt-1">REAL vs FAKE breakdown</p>
              </div>
              <Scan size={16} className="text-brass" />
            </div>
            {currencyDistData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-slate-500">No currency scans yet</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currencyDistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,81,102,0.12)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#151B26', borderRadius: 12, border: '1px solid rgba(59,81,102,0.2)', color: '#F3EFE6' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {currencyDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Scan type distribution pie */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-parchment">Scan Type Split</h3>
                <p className="text-xs text-slate-500 mt-1">Currency vs Message scans</p>
              </div>
              <Activity size={16} className="text-brass" />
            </div>
            {scanTypeDistData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-slate-500">No scans yet</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={scanTypeDistData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {scanTypeDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#151B26', borderRadius: 12, border: '1px solid rgba(59,81,102,0.2)', color: '#F3EFE6' }}
                    />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-slate-500/10 bg-ink-800/60 p-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <span className="text-xs text-slate-400">Filter:</span>
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'currency' as const, label: 'Currency' },
              { id: 'message' as const, label: 'Message' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === f.id ? 'bg-brass text-ink-900' : 'bg-slate-900/40 text-slate-400 hover:text-parchment'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history..."
                className="w-full rounded-lg border border-slate-500/20 bg-slate-900/40 pl-9 pr-3 py-2 text-xs text-parchment outline-none focus:border-brass/40"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-parchment">
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1 rounded-lg bg-slate-900/40 px-3 py-1.5 text-xs text-slate-400 hover:text-parchment"
            >
              {sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              {sortDir === 'desc' ? 'Newest' : 'Oldest'}
            </button>
            <button onClick={refreshHistory} className="rounded-lg bg-slate-900/40 p-1.5 text-slate-400 hover:text-parchment">
              <RotateCcw size={14} />
            </button>
          </div>
          <span className="text-xs text-slate-500">{filteredHistory.length} results</span>
        </div>

        {/* History table */}
        <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 overflow-hidden">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center">
              <Clock size={40} className="mx-auto text-slate-600 mb-4" />
              <p className="text-sm text-slate-400">No scan history found</p>
              <p className="mt-1 text-xs text-slate-500">
                {history.length === 0
                  ? 'Run a currency scan or message analysis to see results here.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-800 text-xs uppercase tracking-[0.3em] text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Verdict / Threat</th>
                    <th className="px-6 py-4">Confidence</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-500/10">
                  {filteredHistory.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {scan.scan_type === 'currency' ? (
                            <Scan size={14} className="text-brass" />
                          ) : (
                            <MessageSquare size={14} className="text-slate-500" />
                          )}
                          <span className="font-medium text-parchment capitalize">{scan.scan_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 capitalize">{scan.source}</td>
                      <td className="px-6 py-4">
                        {scan.scan_type === 'currency' ? (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            scan.verdict === 'REAL'
                              ? 'bg-forest/20 text-forest'
                              : 'bg-oxblood/20 text-oxblood'
                          }`}>
                            {scan.verdict || '—'}
                          </span>
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            scan.threat_level === 'LOW' ? 'bg-forest/20 text-forest'
                            : scan.threat_level === 'MEDIUM' ? 'bg-ochre/20 text-ochre'
                            : 'bg-oxblood/20 text-oxblood'
                          }`}>
                            {scan.threat_level || '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {scan.confidence != null ? (
                          <span className="font-mono text-sm text-parchment">{Math.round(scan.confidence)}%</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(scan.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
