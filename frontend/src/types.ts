export interface MessageAnalysisResponse {
  risk_score: number
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH'
  fraud_probability: number
  suggested_action: string
  reasons: string[]
  matched_signals: string[]
  extracted_entities: {
    phones: string[]
    emails: string[]
    upi_ids: string[]
    urls: string[]
    account_numbers: string[]
    currency_mentions: string[]
  }
  rule_score: number
  ml_score: number
  ml_model_ready: boolean
}

export interface CurrencyAnalysisResponse {
  verdict: 'REAL' | 'FAKE' | 'NO NOTE'
  confidence: number
  authentic_probability: number
  counterfeit_probability: number
  recommendation: string
}

export interface ScanHistoryEntry {
  id: number
  scan_type: string
  source: string
  verdict: string | null
  threat_level: string | null
  confidence: number | null
  payload: Record<string, unknown>
  result: Record<string, unknown>
  created_at: string
}

export interface AlertItem {
  id: number
  title: string
  description: string
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  source: string
  url: string
  published_at: string
}

export interface NewsItem {
  id: number
  title: string
  source: string
  url: string
  published_at: string
}
