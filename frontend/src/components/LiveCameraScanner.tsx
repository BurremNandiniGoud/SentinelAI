import { useEffect, useRef, useState } from 'react'
import { createWebSocket } from '../lib/api'

interface LiveCameraScannerProps {
  onResult: (result: { verdict: string; confidence: number; recommendation: string }) => void
}

export function LiveCameraScanner({ onResult }: LiveCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [status, setStatus] = useState('Starting camera...')
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setStatus('Camera active. Scanning...')
          setActive(true)
        }
      } catch (err) {
        setError('Unable to access camera. Use upload instead.')
        setStatus('Camera unavailable')
      }
    }
    initCamera()

    return () => {
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    const socket = createWebSocket()
    const interval = window.setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !active || socket.readyState !== WebSocket.OPEN) return
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
      canvasRef.current.toBlob((blob) => {
        if (!blob || socket.readyState !== WebSocket.OPEN) return
        blob.arrayBuffer().then((buffer) => socket.send(buffer))
      }, 'image/jpeg', 0.6)
    }, 900)

    socket.onopen = () => setStatus('Live scan connected')
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.error) {
          setError(payload.error)
        } else {
          onResult({ verdict: payload.verdict, confidence: payload.confidence, recommendation: payload.recommendation })
        }
      } catch {
        setError('Unexpected websocket response')
      }
    }
    socket.onerror = () => setError('Live scanner disconnected')
    socketRef.current = socket

    return () => {
      window.clearInterval(interval)
      socket.close()
    }
  }, [active, onResult])

  return (
    <div className="rounded-3xl border border-slate-500/10 bg-ink-800/70 p-5 shadow-soft">
      <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
        <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-slate-950">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-900/80 p-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-3.5 w-3.5 rounded-full bg-forest animate-pulse" />
              <p className="text-sm text-slate-300">Live camera feed</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{status}</p>
          </div>
          {error ? <p className="rounded-2xl bg-oxblood/10 p-3 text-sm text-oxblood">{error}</p> : null}
          <div className="rounded-3xl border border-slate-500/10 bg-ink-900/80 p-4 text-sm text-slate-300">
            Real-time frames are sent to the scanner at 2–3 FPS. This mode is designed to show continuous update behavior while respecting device performance.
          </div>
        </div>
      </div>
    </div>
  )
}
