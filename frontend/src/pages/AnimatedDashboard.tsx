import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Scan, MessageSquare, BarChart3, AlertTriangle,
  Activity, Radio, Cpu, ArrowRight, CheckCircle,
  Bell, FileText, ExternalLink, Loader2,
} from 'lucide-react'
import { CountUp } from '../components/CountUp'
import { MagneticButton } from '../components/MagneticButton'
import { getScanHistory, getAnalyticsSummary } from '../lib/storage'
import type { StoredScan } from '../lib/storage'
import { fetchAlerts, fetchNews } from '../lib/api'
import type { AlertItem, NewsItem } from '../types'

const aiStatusItems = [
  { name: 'Currency CV Model', status: 'Online', uptime: '99.8%', latency: '120ms' },
  { name: 'Message NLP Model', status: 'Online', uptime: '99.7%', latency: '85ms' },
  { name: 'Rule Engine', status: 'Online', uptime: '100%', latency: '15ms' },
  { name: 'Entity Extractor', status: 'Online', uptime: '99.9%', latency: '45ms' },
]

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  if (isNaN(then)) return isoString
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`
  if (diffSec < 172800) return '1 day ago'
  return `${Math.floor(diffSec / 86400)} days ago`
}

export function AnimatedDashboard() {
  const [summary, setSummary] = useState(() => getAnalyticsSummary())
  const [recentScans, setRecentScans] = useState<StoredScan[]>([])
  const [threatCount, setThreatCount] = useState(0)

  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)

  useEffect(() => {
    const saved = getScanHistory()
    setRecentScans(saved.slice(0, 6))
    setSummary(getAnalyticsSummary())
  }, [])

  useEffect(() => {
    fetchAlerts()
      .then((res) => setAlerts(res.data.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setAlertsLoading(false))

    fetchNews()
      .then((res) => setNews(res.data.news ?? []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setThreatCount((c) => c + 1)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-ink-900 text-parchment">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment">SentinelAI Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Threat intelligence and detection tools at your command.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-forest/20 bg-forest/10 px-3 py-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-forest animate-pulse" />
              <span className="text-xs font-medium text-forest">All systems operational</span>
            </div>
            <Link to="/">
              <MagneticButton className="border-slate-500/20 bg-transparent text-slate-400 hover:text-parchment text-xs px-4 py-2">
                Landing Page
              </MagneticButton>
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Scan, title: 'Currency Detection', desc: 'Live camera & upload', to: '/scan-currency', gradient: 'from-forest/10 to-forest/5', border: 'border-forest/20' },
            { icon: MessageSquare, title: 'Message Detection', desc: 'Analyze scam SMS & text', to: '/check-message', gradient: 'from-brass/10 to-brass/5', border: 'border-brass/20' },
            { icon: BarChart3, title: 'Analytics', desc: 'History & insights', to: '/analytics', gradient: 'from-slate-500/10 to-slate-500/5', border: 'border-slate-500/20' },
            { icon: Shield, title: 'Threat Intel', desc: 'Live alerts & advisories', to: null, anchor: '#alerts-section', gradient: 'from-oxblood/10 to-oxblood/5', border: 'border-oxblood/20' },
          ].map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
            >
              {action.to ? (
              <Link to={action.to} className="block">
                <div className={`group rounded-2xl border ${action.border} bg-gradient-to-br ${action.gradient} bg-ink-800/60 p-6 transition-all hover:scale-[1.02] hover:shadow-lg`}>
                  <action.icon size={24} className="text-brass mb-4" />
                  <h3 className="font-semibold text-parchment">{action.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{action.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-brass opacity-0 group-hover:opacity-100 transition-opacity">
                    Open tool <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
              ) : (
              <a href={action.anchor} className="block">
                <div className={`group rounded-2xl border ${action.border} bg-gradient-to-br ${action.gradient} bg-ink-800/60 p-6 transition-all hover:scale-[1.02] hover:shadow-lg`}>
                  <action.icon size={24} className="text-brass mb-4" />
                  <h3 className="font-semibold text-parchment">{action.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{action.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-brass opacity-0 group-hover:opacity-100 transition-opacity">
                    Open tool <ArrowRight size={12} />
                  </div>
                </div>
              </a>
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { value: threatCount + 1200, label: 'Threats Intercepted', suffix: '+', icon: Shield, color: 'text-forest' },
            { value: summary.total, label: 'Total Scans', suffix: '', icon: Activity, color: 'text-brass' },
            { value: 94.8, label: 'Detection Accuracy', suffix: '%', icon: TargetMini, color: 'text-brass' },
            { value: summary.highCount, label: 'High Risk Alerts', suffix: '', icon: AlertTriangle, color: 'text-oxblood' },
            { value: 99.7, label: 'Uptime', suffix: '%', icon: Radio, color: 'text-forest' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
              className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{stat.label}</span>
                <stat.icon size={16} className={stat.color} />
              </div>
              <p className="font-mono text-2xl font-semibold text-parchment">
                <CountUp end={stat.value} decimals={stat.value % 1 !== 0 ? 1 : 0} suffix={stat.suffix} />
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-parchment">Recent Scans</h3>
                <p className="text-xs text-slate-500 mt-1">Latest detection activity</p>
              </div>
              <Link to="/analytics" className="text-xs text-brass hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {recentScans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-500/20 bg-slate-900/40 p-6 text-center">
                  <Activity size={24} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-sm text-slate-400">No scans yet</p>
                  <p className="text-xs text-slate-500 mt-1">Run a scan to see results here</p>
                </div>
              ) : (
                recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center gap-3 rounded-xl border border-slate-500/10 bg-slate-900/40 p-4">
                    <div className={`shrink-0 rounded-lg p-2 ${
                      scan.scan_type === 'currency'
                        ? scan.verdict === 'REAL' ? 'bg-forest/10 text-forest' : 'bg-oxblood/10 text-oxblood'
                        : scan.threat_level === 'HIGH' ? 'bg-oxblood/10 text-oxblood'
                        : scan.threat_level === 'MEDIUM' ? 'bg-ochre/10 text-ochre'
                        : 'bg-forest/10 text-forest'
                    }`}>
                      {scan.scan_type === 'currency' ? <Scan size={16} /> : <MessageSquare size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-parchment truncate">
                        {scan.scan_type === 'currency' ? `Currency: ${scan.verdict || 'UNKNOWN'}` : `Message: ${scan.threat_level || 'UNKNOWN'}`}
                      </p>
                      <p className="text-xs text-slate-500">{new Date(scan.created_at).toLocaleString()}</p>
                    </div>
                    {scan.confidence != null && (
                      <span className="font-mono text-sm text-slate-400">{Math.round(scan.confidence)}%</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div
            id="alerts-section"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-parchment">Latest Scam Alerts</h3>
                <p className="text-xs text-slate-500 mt-1">Government advisories</p>
              </div>
              <Bell size={16} className="text-brass" />
            </div>
            <div className="space-y-3">
              {alertsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-slate-500" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-500/20 bg-slate-900/40 p-6 text-center">
                  <Bell size={20} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500">No alerts available</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-slate-500/10 bg-slate-900/40 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-parchment">{alert.title}</h4>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        alert.level === 'HIGH' ? 'bg-oxblood/20 text-oxblood' :
                        alert.level === 'MEDIUM' ? 'bg-ochre/20 text-ochre' :
                        'bg-forest/20 text-forest'
                      }`}>{alert.level}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{alert.description}</p>
                    <p className="mt-2 text-[10px] text-slate-600">{formatRelativeTime(alert.published_at)}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-parchment">AI Status</h3>
                  <p className="text-xs text-slate-500 mt-1">Model health</p>
                </div>
                <Cpu size={16} className="text-brass" />
              </div>
              <div className="space-y-3">
                {aiStatusItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/40 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-parchment truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.uptime} · {item.latency}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                      <span className="text-[10px] text-forest">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-parchment">News</h3>
                  <p className="text-xs text-slate-500 mt-1">Cyber safety updates</p>
                </div>
                <FileText size={16} className="text-brass" />
              </div>
              <div className="space-y-3">
                {newsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-slate-500" />
                  </div>
                ) : news.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-500/20 bg-slate-900/40 p-6 text-center">
                    <FileText size={20} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500">No news available</p>
                  </div>
                ) : (
                  news.map((item) => (
                    <a
                      key={item.id}
                      href={item.url || '#'}
                      target={item.url ? '_blank' : undefined}
                      rel={item.url ? 'noopener noreferrer' : undefined}
                      className="block rounded-lg border border-slate-500/10 bg-slate-900/40 p-3 hover:border-slate-500/30 transition-colors"
                    >
                      <p className="text-xs font-medium text-parchment leading-5">{item.title}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{item.source}</p>
                    </a>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
          >
            <h3 className="font-semibold text-parchment mb-5">Safety Tips</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'Never share OTPs or PINs',
                'Verify URLs before clicking',
                'Report fraud at 1930 immediately',
                'Enable 2FA on all accounts',
                'Banks never call for card details',
                'Be wary of urgent threats',
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-900/40 px-3 py-2.5">
                  <CheckCircle size={14} className="text-forest shrink-0" />
                  <span className="text-xs text-slate-300">{tip}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
          >
            <h3 className="font-semibold text-parchment mb-5">Government Advisory</h3>
            <div className="space-y-3">
              {[
                { title: 'Cyber Crime Reporting Portal', desc: 'Report online fraud at cybercrime.gov.in', url: 'https://cybercrime.gov.in' },
                { title: 'National Helpline 1930', desc: 'Call immediately after fraud to freeze transactions', url: '#' },
                { title: 'Sanchar Saathi Portal', desc: 'Report fraudulent calls and SMS', url: 'https://sancharsaathi.gov.in' },
                { title: 'RBI Banking Ombudsman', desc: 'File complaints about banking fraud', url: 'https://rbi.org.in' },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-500/10 bg-slate-900/40 p-4 hover:border-slate-500/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-parchment">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-600 shrink-0" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function TargetMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
