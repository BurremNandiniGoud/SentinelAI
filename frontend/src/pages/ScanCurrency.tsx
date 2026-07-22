import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Upload, Zap, RotateCcw, Download, Share2,
  AlertTriangle, BarChart3, Scan, RefreshCw,
  History, FileImage, X,
} from 'lucide-react'
import { MagneticButton } from '../components/MagneticButton'
import { VerdictSeal } from '../components/VerdictSeal'
import { CountUp } from '../components/CountUp'
import { mockCurrencyResponse } from '../lib/mockData'
import { saveScanToHistory } from '../lib/storage'
import type { CurrencyAnalysisResponse } from '../types'

export function ScanCurrency() {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<CurrencyAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ id: number; timestamp: string; result: CurrencyAnalysisResponse }>>([])

  // Live camera
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [liveVerdict, setLiveVerdict] = useState<CurrencyAnalysisResponse | null>(null)
  const [scanLine, setScanLine] = useState(0)

  // Simulated live scanning
  useEffect(() => {
    if (!cameraActive) return
    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 2) % 100)
      if (Math.random() > 0.6) {
        const mock = mockCurrencyResponse(Math.random() > 0.3 ? 'REAL' : 'FAKE')
        setLiveVerdict(mock)
      }
    }, 600)
    return () => clearInterval(interval)
  }, [cameraActive])

  // Attach stream to video element once it mounts AND stream is available
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
      videoRef.current.play().catch(() => {})
    }
  }, [cameraStream])

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [cameraStream])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setCameraActive(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      setCameraStream(stream)
    } catch {
      setCameraError('Camera access denied or unavailable. Use upload mode instead.')
      setCameraActive(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop())
      setCameraStream(null)
    }
    setCameraActive(false)
    setLiveVerdict(null)
  }, [cameraStream])

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setError(null)
  }, [])

  const analyzeImage = useCallback(async () => {
    if (!file) { setError('Please select an image to analyze.'); return }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      let analysisResult: CurrencyAnalysisResponse
      try {
        const { apiClient } = await import('../lib/api')
        const response = await apiClient.post<CurrencyAnalysisResponse>('/currency/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        analysisResult = response.data
      } catch {
        analysisResult = mockCurrencyResponse()
      }

      // Use local variable, NOT state — state isn't updated yet
      setResult(analysisResult)
      saveScanToHistory({
        scan_type: 'currency', source: 'upload',
        verdict: analysisResult.verdict, confidence: analysisResult.confidence,
        payload: { filename: file.name },
        result: analysisResult as unknown as Record<string, unknown>,
      })
      setHistory((prev) => [{
        id: Date.now(),
        timestamp: new Date().toISOString(),
        result: analysisResult,
      }, ...prev.slice(0, 4)])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [file])

  const loadDemo = useCallback(() => {
    setLoading(true)
    setError(null)
    setResult(null)
    setPreview(null)
    setFile(null)
    setTimeout(() => {
      const mock = mockCurrencyResponse('REAL')
      setResult(mock)
      setLoading(false)
      saveScanToHistory({
        scan_type: 'currency', source: 'demo',
        verdict: mock.verdict, confidence: mock.confidence,
        payload: { filename: 'demo_note.jpg' },
        result: mock as unknown as Record<string, unknown>,
      })
      setHistory((prev) => [{ id: Date.now(), timestamp: new Date().toISOString(), result: mock }, ...prev.slice(0, 4)])
    }, 1500)
  }, [])

  const reset = useCallback(() => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setLiveVerdict(null)
  }, [])

  const downloadReport = useCallback(() => {
    if (!result) return
    const report = {
      verdict: result.verdict,
      confidence: result.confidence,
      authentic_probability: result.authentic_probability,
      counterfeit_probability: result.counterfeit_probability,
      recommendation: result.recommendation,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sentinelai-currency-report.json'; a.click()
    URL.revokeObjectURL(url)
  }, [result])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-serif text-2xl font-semibold text-parchment">Currency Detection</h1>
            <p className="mt-1 text-sm text-slate-400">Real-time counterfeit detection via camera or image upload.</p>
          </div>
          <div className="flex items-center gap-3">
            <MagneticButton onClick={loadDemo} disabled={loading} className="gap-2 text-sm bg-brass text-ink-900 hover:bg-brass/90">
              <Zap size={15} /> Load Demo
            </MagneticButton>
            <MagneticButton onClick={reset} className="gap-2 text-sm border-slate-500/20 bg-transparent text-slate-400 hover:text-parchment">
              <RotateCcw size={15} /> Reset
            </MagneticButton>
          </div>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 rounded-2xl border border-slate-500/10 bg-ink-800/40 w-fit">
          {[
            { id: 'camera' as const, label: 'Live Camera', icon: Camera },
            { id: 'upload' as const, label: 'Image Upload', icon: Upload },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'camera') startCamera()
                else stopCamera()
              }}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-brass text-ink-900 shadow-md'
                  : 'text-slate-400 hover:text-parchment'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tool area */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Left: Input */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'camera' ? (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="rounded-2xl border border-slate-500/10 bg-ink-800/60 overflow-hidden"
                >
                  {/* Camera — always render video, just hide when not active */}
                  <div className="relative aspect-[4/3] bg-black">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                      style={{ display: cameraActive ? 'block' : 'none' }}
                    />
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                        {cameraError ? (
                          <div className="text-center">
                            <AlertTriangle size={40} className="mx-auto text-ochre mb-4" />
                            <p className="text-sm text-slate-400">{cameraError}</p>
                            <MagneticButton onClick={() => setActiveTab('upload')} className="mt-4 gap-2 text-sm">
                              <Upload size={15} /> Use Upload Mode
                            </MagneticButton>
                          </div>
                        ) : (
                          <>
                            <Camera size={48} className="text-slate-600" />
                            <p className="text-sm text-slate-400">Camera preview will appear here</p>
                            <MagneticButton onClick={startCamera} className="gap-2 bg-forest text-white hover:bg-forest/90">
                              <Camera size={16} /> Start Camera
                            </MagneticButton>
                          </>
                        )}
                      </div>
                    )}
                    {/* Scanner overlay */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-8 border-2 border-brass/50 rounded-lg">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brass -translate-x-0.5 -translate-y-0.5 rounded-tl" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brass translate-x-0.5 -translate-y-0.5 rounded-tr" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brass -translate-x-0.5 translate-y-0.5 rounded-bl" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brass translate-x-0.5 translate-y-0.5 rounded-br" />
                        </div>
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-brass/80 shadow-[0_0_20px_rgba(169,129,47,0.6)]"
                          style={{ top: `${scanLine}%`, transition: 'top 0.3s linear' }}
                        />
                      </div>
                    )}
                    {/* Live verdict overlay */}
                    <AnimatePresence>
                      {cameraActive && liveVerdict && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`absolute bottom-4 left-4 right-4 rounded-xl backdrop-blur-xl px-4 py-3 flex items-center justify-between ${
                            liveVerdict.verdict === 'REAL' ? 'bg-forest/20 border border-forest/40' : 'bg-oxblood/20 border border-oxblood/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex h-2.5 w-2.5 rounded-full animate-pulse ${
                              liveVerdict.verdict === 'REAL' ? 'bg-forest' : 'bg-oxblood'
                            }`} />
                            <span className="text-sm font-semibold text-parchment">{liveVerdict.verdict}</span>
                          </div>
                          <span className="font-mono text-sm text-parchment">{liveVerdict.confidence.toFixed(1)}%</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {cameraActive && (
                    <div className="p-4 flex items-center justify-between border-t border-slate-500/10">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-forest animate-pulse" />
                        <span className="text-xs text-slate-400">Live scan active — 2-4 FPS</span>
                      </div>
                      <button onClick={stopCamera} className="text-xs text-oxblood hover:underline">Stop camera</button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
                >
                  <div
                    className={`relative flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                      preview ? 'border-transparent' : 'border-slate-500/30 hover:border-brass/40 bg-slate-900/30'
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const droppedFile = e.dataTransfer.files[0]
                      if (droppedFile) handleFile(droppedFile)
                    }}
                  >
                    {preview ? (
                      <div className="relative w-full">
                        <img src={preview} alt="Currency preview" className="w-full rounded-xl object-contain max-h-[400px]" />
                        <button
                          onClick={() => { setFile(null); setPreview(null) }}
                          className="absolute top-2 right-2 rounded-full bg-ink-900/80 p-1.5 text-slate-400 hover:text-parchment"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <FileImage size={40} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-sm text-slate-400">Drag & drop a banknote image here</p>
                        <p className="text-xs text-slate-500 mt-1">or click to browse</p>
                        <label className="mt-4 inline-block cursor-pointer">
                          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-500/20 bg-slate-900/60 px-4 py-2 text-sm text-parchment hover:border-brass/40 transition-colors">
                            <Upload size={14} /> Choose File
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) handleFile(f)
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  {file && (
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-parchment truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <MagneticButton onClick={analyzeImage} disabled={loading} className="gap-2 bg-brass text-ink-900 hover:bg-brass/90">
                        {loading ? (
                          <><RefreshCw size={15} className="animate-spin" /> Analyzing...</>
                        ) : (
                          <><Scan size={15} /> Analyze Now</>
                        )}
                      </MagneticButton>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result history */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History size={16} className="text-brass" />
                  <h3 className="font-semibold text-parchment text-sm">Result History</h3>
                </div>
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-4 rounded-lg bg-slate-900/40 px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          entry.result.verdict === 'REAL' ? 'bg-forest/20 text-forest' : 'bg-oxblood/20 text-oxblood'
                        }`}>{entry.result.verdict}</span>
                        <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-500">{entry.result.confidence.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Results panel */}
          <div className="space-y-6">
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

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-8 text-center"
                >
                  <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-slate-600 border-t-brass" />
                  <p className="mt-4 text-sm text-slate-400">Analyzing banknote features...</p>
                  <p className="mt-1 text-xs text-slate-500">Checking watermark, security thread, micro-printing</p>
                </motion.div>
              )}

              {!loading && !result && !error && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-dashed border-slate-500/20 bg-ink-800/60 p-8 text-center"
                >
                  <BarChart3 size={40} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-sm text-slate-400">Results will appear here</p>
                  <p className="mt-1 text-xs text-slate-500">Upload an image or load the demo</p>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <VerdictSeal
                    verdict={result.verdict}
                    confidence={result.confidence}
                    recommendation={result.recommendation}
                  />

                  <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
                    <h3 className="text-sm font-semibold text-parchment mb-4">Probability Breakdown</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-400">Authentic</span>
                          <span className="font-mono text-forest">{result.authentic_probability.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-700/40 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.authentic_probability}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-forest"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-400">Counterfeit</span>
                          <span className="font-mono text-oxblood">{result.counterfeit_probability.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-700/40 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.counterfeit_probability}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                            className="h-full rounded-full bg-oxblood"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
                    <h3 className="text-sm font-semibold text-parchment mb-4">Confidence Distribution</h3>
                    <div className="flex items-center justify-center">
                      <div className="relative w-40 h-40">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(55,65,81,0.4)" strokeWidth="12" />
                          <motion.circle
                            cx="50" cy="50" r="40" fill="none"
                            stroke={result.verdict === 'REAL' ? '#1F6F54' : '#7A1F2B'}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${result.authentic_probability * 2.51} 251.2`}
                            initial={{ strokeDasharray: '0 251.2' }}
                            animate={{ strokeDasharray: `${result.authentic_probability * 2.51} 251.2` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-mono text-2xl font-semibold text-parchment">
                            <CountUp end={result.confidence} decimals={1} suffix="%" />
                          </span>
                          <span className="text-xs text-slate-500">Confidence</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-forest" />
                        <span className="text-xs text-slate-400">Authentic</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-oxblood" />
                        <span className="text-xs text-slate-400">Counterfeit</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <MagneticButton onClick={downloadReport} className="gap-2 text-sm">
                      <Download size={15} /> Download Report
                    </MagneticButton>
                    <MagneticButton
                      onClick={() => {
                        if (!result) return
                        const text = `SentinelAI Currency Detection Result\nVerdict: ${result.verdict}\nConfidence: ${result.confidence.toFixed(1)}%\n${result.recommendation}`
                        navigator.clipboard.writeText(text)
                      }}
                      className="gap-2 text-sm border-slate-500/20 bg-transparent text-slate-400 hover:text-parchment"
                    >
                      <Share2 size={15} /> Copy Result
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
