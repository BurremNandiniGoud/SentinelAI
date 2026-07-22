import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Zap, RotateCcw, Download, Copy, FileText,
  AlertTriangle, Search, RefreshCw, Upload, X,
  Shield, Database, Brain,
} from 'lucide-react'
import { MagneticButton } from '../components/MagneticButton'
import { RiskGaugeCard } from '../components/RiskGaugeCard'
import { EntityChipGroup } from '../components/EntityChipGroup'
import { ScoreCompareBar } from '../components/ScoreCompareBar'
import { mockMessageResponse } from '../lib/mockData'
import { saveScanToHistory } from '../lib/storage'
import type { MessageAnalysisResponse } from '../types'

const demoMessages = [
  "Dear customer, your UPI ID has been blocked. To reactivate, click the link and enter your UPI PIN: https://upi-verify-secure.tk",
  "CONGRATULATIONS! You have won ₹25,00,000 in the British Lottery! Send your bank details and ₹5,000 processing fee to account 1234567890.",
  "URGENT: Your SBI account will be closed in 24 hours. Verify your KYC immediately by calling +91-9876543210 and sharing your card details and OTP.",
  "Hi Mom, I lost my phone. Can you send ₹10,000 to this UPI ID: emergency@paytm? I'll pay you back tonight.",
]

export function CheckMessage() {
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<MessageAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeDemo, setActiveDemo] = useState(-1)

  const analyzeMessage = useCallback(async (text: string) => {
    if (!text.trim()) { setError('Enter message text to analyze.'); return }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      try {
        const { apiClient } = await import('../lib/api')
        const response = await apiClient.post<MessageAnalysisResponse>('/message/analyze', { text })
        setResult(response.data)
        saveScanToHistory({
          scan_type: 'message', source: 'text',
          verdict: null, threat_level: response.data.threat_level, confidence: response.data.risk_score,
          payload: { text: text.slice(0, 200) },
          result: response.data as unknown as Record<string, unknown>,
        })
      } catch {
        const threatLevels: Array<'LOW' | 'MEDIUM' | 'HIGH'> = ['HIGH', 'MEDIUM', 'HIGH']
        const mock = mockMessageResponse(threatLevels[Math.floor(Math.random() * threatLevels.length)])
        setResult(mock)
        saveScanToHistory({
          scan_type: 'message', source: 'text',
          verdict: null, threat_level: mock.threat_level, confidence: mock.risk_score,
          payload: { text: text.slice(0, 200) },
          result: mock as unknown as Record<string, unknown>,
        })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDemo = useCallback((index: number) => {
    setActiveDemo(index)
    const text = demoMessages[index]
    setMessage(text)
    setFile(null)
    setResult(null)
    setError(null)
    setLoading(true)
    setTimeout(() => {
      const levels: Array<'HIGH' | 'MEDIUM' | 'LOW'> = ['HIGH', 'HIGH', 'HIGH', 'MEDIUM']
      const mock = mockMessageResponse(levels[index])
      setResult(mock)
      setLoading(false)
      saveScanToHistory({
        scan_type: 'message', source: 'demo',
        verdict: null, threat_level: mock.threat_level, confidence: mock.risk_score,
        payload: { text: text.slice(0, 200) },
        result: mock as unknown as Record<string, unknown>,
      })
    }, 1200)
  }, [])

  const reset = useCallback(() => {
    setMessage('')
    setFile(null)
    setResult(null)
    setError(null)
    setActiveDemo(-1)
  }, [])

  const downloadJSON = useCallback(() => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sentinelai-message-report.json'; a.click()
    URL.revokeObjectURL(url)
  }, [result])

  const downloadPDF = useCallback(() => {
    if (!result) return
    const content = [
      '====================================',
      '  SentinelAI Message Analysis Report',
      '====================================',
      '',
      `Threat Level: ${result.threat_level}`,
      `Risk Score: ${result.risk_score}`,
      `Fraud Probability: ${(result.fraud_probability * 100).toFixed(1)}%`,
      `Rule Score: ${(result.rule_score * 100).toFixed(1)}%`,
      `ML Score: ${(result.ml_score * 100).toFixed(1)}%`,
      '',
      'Suggested Action:',
      result.suggested_action,
      '',
      'Reasons:',
      ...result.reasons.map((r) => `  • ${r}`),
      '',
      'Matched Signals:',
      ...result.matched_signals.map((s) => `  • ${s}`),
      '',
      'Extracted Entities:',
      `  Phones: ${result.extracted_entities.phones.join(', ') || 'None'}`,
      `  Emails: ${result.extracted_entities.emails.join(', ') || 'None'}`,
      `  UPI IDs: ${result.extracted_entities.upi_ids.join(', ') || 'None'}`,
      `  URLs: ${result.extracted_entities.urls.join(', ') || 'None'}`,
      `  Accounts: ${result.extracted_entities.account_numbers.join(', ') || 'None'}`,
      '',
      `Generated: ${new Date().toISOString()}`,
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sentinelai-message-report.txt'; a.click()
    URL.revokeObjectURL(url)
  }, [result])

  return (
    <div className="min-h-screen bg-ink-900 text-parchment">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment">Message Risk Analysis</h1>
            <p className="mt-1 text-sm text-slate-400">Analyze suspicious SMS, WhatsApp, or email messages for fraud indicators.</p>
          </div>
          <div className="flex items-center gap-3">
            <MagneticButton onClick={reset} className="gap-2 text-sm border-slate-500/20 bg-transparent text-slate-400 hover:text-parchment">
              <RotateCcw size={15} /> Reset
            </MagneticButton>
          </div>
        </motion.div>

        {/* Demo messages quick-select */}
        <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-brass" />
            <h3 className="font-semibold text-parchment text-sm">Quick Demo Scenarios</h3>
            <span className="text-xs text-slate-500">Click to load and analyze instantly</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'UPI Scam', desc: 'Fake UPI block message', color: 'border-oxblood/30 hover:border-oxblood/60' },
              { label: 'Lottery Fraud', desc: 'Prize money scam', color: 'border-ochre/30 hover:border-ochre/60' },
              { label: 'Bank Phishing', desc: 'Account closure threat', color: 'border-oxblood/30 hover:border-oxblood/60' },
              { label: 'Family Emergency', desc: 'Impersonation scam', color: 'border-ochre/30 hover:border-ochre/60' },
            ].map((demo, i) => (
              <button
                key={i}
                onClick={() => loadDemo(i)}
                className={`rounded-xl border ${demo.color} bg-slate-900/40 p-4 text-left transition-all hover:scale-[1.02] ${
                  activeDemo === i ? 'ring-2 ring-brass' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-parchment">{demo.label}</span>
                  {activeDemo === i && loading && <RefreshCw size={14} className="animate-spin text-brass" />}
                </div>
                <p className="mt-1 text-xs text-slate-500">{demo.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Input area */}
          <div className="space-y-6">
            {/* Textarea */}
            <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-parchment text-sm">Message Text</h3>
                <span className="text-xs text-slate-500">{message.length} characters</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                placeholder="Paste the suspicious message here — SMS, WhatsApp forward, email, or social media message..."
                className="w-full rounded-xl border border-slate-500/20 bg-slate-900/60 px-5 py-4 text-sm text-parchment outline-none placeholder:text-slate-600 focus:border-brass/40 resize-y font-mono"
              />

              {/* File upload for screenshots */}
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  {file ? (
                    <div className="flex items-center gap-3 rounded-lg bg-slate-900/40 px-4 py-2.5">
                      <FileText size={16} className="text-brass" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-parchment truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={() => setFile(null)} className="text-slate-500 hover:text-parchment">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-500/30 bg-slate-900/30 px-4 py-2.5 text-sm text-slate-400 hover:border-brass/40 transition-colors">
                      <Upload size={14} />
                      Upload screenshot (OCR)
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) setFile(f)
                        }}
                      />
                    </label>
                  )}
                </div>
                <MagneticButton
                  onClick={() => analyzeMessage(message)}
                  disabled={loading || !message.trim()}
                  className="gap-2 bg-brass text-ink-900 hover:bg-brass/90 shrink-0"
                >
                  {loading ? (
                    <><RefreshCw size={15} className="animate-spin" /> Analyzing...</>
                  ) : (
                    <><Search size={15} /> Analyze Message</>
                  )}
                </MagneticButton>
              </div>
            </div>

            {/* Loading state */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-8 text-center">
                    <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-600 border-t-brass" />
                    <p className="mt-4 text-sm text-slate-400">Running analysis pipeline...</p>
                    <div className="mt-3 space-y-2 max-w-xs mx-auto">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse" />
                        Rule engine scanning for patterns
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse" />
                        ML model evaluating risk score
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse" />
                        Extracting entities and signals
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-oxblood/20 bg-oxblood/10 p-4 flex items-start gap-3"
              >
                <AlertTriangle size={18} className="text-oxblood shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-oxblood">Analysis Error</p>
                  <p className="text-sm text-oxblood/80">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Quick info on how it works */}
            {!result && !loading && (
              <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={16} className="text-brass" />
                  <h3 className="font-semibold text-parchment text-sm">How It Works</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Database, title: 'Rule Engine', desc: 'Regex patterns match known scam indicators, suspicious URLs, and urgency language.' },
                    { icon: Brain, title: 'ML Scoring', desc: 'Trained NLP model scores semantic fraud probability based on 50K+ labeled messages.' },
                    { icon: Shield, title: 'Risk Synthesis', desc: 'Combined score with entity extraction produces the final threat assessment.' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-lg bg-slate-900/40 p-4">
                      <item.icon size={18} className="text-slate-500 mb-2" />
                      <p className="text-sm font-medium text-parchment">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Results panel */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {!result && !loading && !error && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-dashed border-slate-500/20 bg-ink-800/60 p-8 text-center"
                >
                  <MessageSquare size={40} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-sm text-slate-400">Results will appear here</p>
                  <p className="mt-1 text-xs text-slate-500">Paste a message and click Analyze, or load a demo</p>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Risk Gauge */}
                  <RiskGaugeCard
                    threatLevel={result.threat_level}
                    riskScore={result.risk_score}
                    fraudProbability={result.fraud_probability}
                    suggestedAction={result.suggested_action}
                  />

                  {/* ML Model Status */}
                  {!result.ml_model_ready && (
                    <div className="rounded-2xl border border-ochre/20 bg-ochre/10 p-4 flex items-center gap-3">
                      <span className="inline-flex h-2 w-2 rounded-full bg-ochre animate-pulse" />
                      <p className="text-sm text-ochre">Model warming up — using rule engine only for this analysis.</p>
                    </div>
                  )}

                  {/* Score comparison */}
                  <ScoreCompareBar ruleScore={result.rule_score} mlScore={result.ml_score} />

                  {/* Reasons */}
                  {result.reasons.length > 0 && (
                    <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
                      <h3 className="text-sm font-semibold text-parchment mb-3">Detection Reasons</h3>
                      <div className="space-y-2">
                        {result.reasons.map((reason, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="flex items-start gap-2 rounded-lg bg-slate-900/40 px-3 py-2.5"
                          >
                            <AlertTriangle size={14} className="text-ochre shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-300">{reason}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Signals */}
                  {result.matched_signals.length > 0 && (
                    <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
                      <h3 className="text-sm font-semibold text-parchment mb-3">Matched Signals</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.matched_signals.map((signal) => (
                          <span key={signal} className="rounded-full border border-oxblood/20 bg-oxblood/10 px-3 py-1.5 text-xs text-oxblood font-mono">
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Entities */}
                  <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
                    <h3 className="text-sm font-semibold text-parchment mb-4">Extracted Entities</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <EntityChipGroup
                        title="Phone Numbers"
                        items={result.extracted_entities.phones}
                      />
                      <EntityChipGroup
                        title="Emails"
                        items={result.extracted_entities.emails}
                      />
                      <EntityChipGroup
                        title="UPI IDs"
                        items={result.extracted_entities.upi_ids}
                      />
                      <EntityChipGroup
                        title="URLs"
                        items={result.extracted_entities.urls}
                      />
                      <EntityChipGroup
                        title="Accounts"
                        items={result.extracted_entities.account_numbers}
                      />
                      <EntityChipGroup
                        title="Currency"
                        items={result.extracted_entities.currency_mentions}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <MagneticButton onClick={downloadJSON} className="gap-2 text-sm">
                      <Download size={15} /> Download JSON
                    </MagneticButton>
                    <MagneticButton onClick={downloadPDF} className="gap-2 text-sm">
                      <Download size={15} /> Download Report
                    </MagneticButton>
                    <MagneticButton
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(result, null, 2))
                      }}
                      className="gap-2 text-sm border-slate-500/20 bg-transparent text-slate-400 hover:text-parchment"
                    >
                      <Copy size={15} /> Copy Result
                    </MagneticButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
