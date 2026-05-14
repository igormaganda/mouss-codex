'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock3, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/hooks/use-store'

const MIN_DURATION_HOURS = 1
const MAX_DURATION_HOURS = 4
const ALERT_HOURS = 3

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function SessionTimerGauge() {
  const userId = useAppStore((s) => s.userId) ?? 'guest'
  const currentRole = useAppStore((s) => s.currentRole)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const storageKey = `creascope-session-start:${currentRole}:${userId}`

  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      setStartedAt(Number(raw))
      return
    }
    const start = Date.now()
    setStartedAt(start)
    localStorage.setItem(storageKey, String(start))
  }, [storageKey])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const elapsedMs = startedAt ? now - startedAt : 0
  const maxMs = MAX_DURATION_HOURS * 60 * 60 * 1000
  const minMs = MIN_DURATION_HOURS * 60 * 60 * 1000
  const alertMs = ALERT_HOURS * 60 * 60 * 1000
  const remainingMs = Math.max(0, maxMs - elapsedMs)
  const percent = Math.min(100, Math.max(0, (elapsedMs / maxMs) * 100))
  const thresholdPercent = (alertMs / maxMs) * 100

  const gaugeColor = useMemo(() => {
    if (elapsedMs >= alertMs) return 'bg-red-500'
    if (elapsedMs >= minMs) return 'bg-amber-500'
    return 'bg-emerald-500'
  }, [elapsedMs, alertMs, minMs])

  const labelColor = elapsedMs >= alertMs ? 'text-red-600' : 'text-gray-600'

  const resetTimer = () => {
    const start = Date.now()
    setStartedAt(start)
    localStorage.setItem(storageKey, String(start))
  }

  return (
    <div className="hidden lg:flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 min-w-[290px]">
      <Clock3 className="h-4 w-4 text-gray-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[11px] font-medium">
          <span className={labelColor}>Écoulé {formatDuration(elapsedMs)}</span>
          <span className={labelColor}>Restant {formatDuration(remainingMs)}</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden relative">
          <div className={`h-full ${gaugeColor} transition-all duration-700`} style={{ width: `${percent}%` }} />
          <div
            className="absolute top-0 bottom-0 border-l border-red-600/70"
            style={{ left: `${thresholdPercent}%` }}
            aria-hidden="true"
          />
        </div>
        <p className="mt-1 text-[10px] text-gray-500">Jauge 1h → 4h (alerte rouge après 3h)</p>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={resetTimer} title="Réinitialiser le timer">
        <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
      </Button>
    </div>
  )
}

