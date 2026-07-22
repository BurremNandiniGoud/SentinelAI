import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
})

export const analyzeMessage = (text: string) =>
  apiClient.post('/message/analyze', { text })

export const analyzeCurrencyImage = (formData: FormData) =>
  apiClient.post('/currency/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const fetchAnalytics = (scanType?: string) =>
  apiClient.get('/analytics', { params: { scan_type: scanType } })

export const createWebSocket = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  return new WebSocket(baseUrl.replace(/^http/, 'ws') + '/api/currency/live')
}

export const fetchAlerts = (limit = 10) =>
  apiClient.get('/alerts', { params: { limit } })

export const fetchNews = (limit = 10) =>
  apiClient.get('/news', { params: { limit } })
