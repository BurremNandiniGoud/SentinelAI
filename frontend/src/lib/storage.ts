const HISTORY_KEY = 'sentinelai_scan_history'

export interface StoredScan {
  id: number
  scan_type: 'currency' | 'message'
  source: string
  verdict: string | null
  threat_level: string | null
  confidence: number | null
  payload: Record<string, unknown>
  result: Record<string, unknown>
  created_at: string
}

export function getScanHistory(): StoredScan[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredScan[]
  } catch {
    return []
  }
}

export function saveScanToHistory(entry: {
  scan_type: 'currency' | 'message'
  source: string
  verdict?: string | null
  threat_level?: string | null
  confidence?: number | null
  payload: Record<string, unknown>
  result: Record<string, unknown>
}): void {
  const history = getScanHistory()
  const newEntry: StoredScan = {
    id: Date.now(),
    scan_type: entry.scan_type,
    source: entry.source,
    verdict: entry.verdict ?? null,
    threat_level: entry.threat_level ?? null,
    confidence: entry.confidence ?? null,
    payload: entry.payload,
    result: entry.result,
    created_at: new Date().toISOString(),
  }
  history.unshift(newEntry)
  const trimmed = history.slice(0, 500)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
}

export function clearScanHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function exportHistoryCSV(): string {
  const history = getScanHistory()
  const headers = ['id', 'scan_type', 'source', 'verdict', 'threat_level', 'confidence', 'created_at']
  const rows = history.map((entry) =>
    [entry.id, entry.scan_type, entry.source, entry.verdict ?? '', entry.threat_level ?? '', entry.confidence?.toString() ?? '', entry.created_at]
      .map((v) => `"${v}"`)
      .join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

export function exportHistoryJSON(): string {
  return JSON.stringify(getScanHistory(), null, 2)
}

export function getAnalyticsSummary() {
  const history = getScanHistory()
  const total = history.length
  const currencyScans = history.filter((s) => s.scan_type === 'currency')
  const messageScans = history.filter((s) => s.scan_type === 'message')
  const realCount = currencyScans.filter((s) => s.verdict === 'REAL').length
  const fakeCount = currencyScans.filter((s) => s.verdict === 'FAKE').length
  const lowCount = messageScans.filter((s) => s.threat_level === 'LOW').length
  const mediumCount = messageScans.filter((s) => s.threat_level === 'MEDIUM').length
  const highCount = messageScans.filter((s) => s.threat_level === 'HIGH').length
  const avgConfidenceCurrency = currencyScans.length
    ? currencyScans.reduce((acc, s) => acc + (s.confidence ?? 0), 0) / currencyScans.length
    : 0
  const avgConfidenceMessage = messageScans.length
    ? messageScans.reduce((acc, s) => acc + (s.confidence ?? 0), 0) / messageScans.length
    : 0

  const dailyStats: Record<string, { currency: number; message: number; real: number; fake: number; low: number; medium: number; high: number }> = {}
  history.forEach((s) => {
    const day = s.created_at.slice(0, 10)
    if (!dailyStats[day]) {
      dailyStats[day] = { currency: 0, message: 0, real: 0, fake: 0, low: 0, medium: 0, high: 0 }
    }
    if (s.scan_type === 'currency') {
      dailyStats[day].currency++
      if (s.verdict === 'REAL') dailyStats[day].real++
      if (s.verdict === 'FAKE') dailyStats[day].fake++
    } else {
      dailyStats[day].message++
      if (s.threat_level === 'LOW') dailyStats[day].low++
      if (s.threat_level === 'MEDIUM') dailyStats[day].medium++
      if (s.threat_level === 'HIGH') dailyStats[day].high++
    }
  })

  return {
    total,
    currencyScans: currencyScans.length,
    messageScans: messageScans.length,
    realCount,
    fakeCount,
    lowCount,
    mediumCount,
    highCount,
    avgConfidenceCurrency,
    avgConfidenceMessage,
    dailyStats,
    history,
  }
}
