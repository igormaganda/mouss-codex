'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  CheckCircle2,
  Circle,
  Clock,
  Timer,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Calendar,
  RotateCcw,
  ArrowRight,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

type SessionMode = 'continuous' | 'split'

const PHASES_BASE = [
  {
    key: 'PHASE_1_ACCUEIL',
    title: 'Accueil & Profil',
    durationContinuous: 45,
    durationSplit: 55,
    color: 'emerald' as const,
    description: "Accueil du porteur, présentation du parcours, recueil des motivations initiales et du parcours personnel.",
    checklist: [
      "Accueil et mise en confiance du porteur",
      "Présentation du déroulé de l'entretien",
      "Recueil du parcours personnel et professionnel",
      "Identification des motivations de création",
      "Premières impressions et questions ouvertes",
      "Vérification des prérequis administratifs",
    ],
  },
  {
    key: 'PHASE_2_DIAGNOSTIC',
    title: 'Diagnostic Approfondi',
    durationContinuous: 75,
    durationSplit: 55,
    color: 'violet' as const,
    description: "Analyse complète du projet : marché, compétences, RIASEC, Kiviat, étude financière prévisionnelle.",
    checklist: [
      "Présentation et analyse du projet entrepreneurial",
      "Jeu des Pépites — Identification des soft skills",
      "Diagramme de Kiviat — Évaluation entrepreneuriale",
      "Test RIASEC — Profil dominant",
      "Analyse de marché et positionnement concurrentiel",
      "Évaluation financière prévisionnelle",
      "Identification des freins et points de vigilance",
      "Analyse juridique — Choix du statut",
    ],
  },
  {
    key: 'PHASE_3_SYNTHESE',
    title: 'Synthèse & Feuille de route',
    durationContinuous: 60,
    durationSplit: 55,
    color: 'amber' as const,
    description: "Synthèse de l'ensemble du diagnostic, prise de décision Go/No-Go, et co-construction du plan d'actions personnalisé.",
    checklist: [
      "Synthèse des résultats de tous les modules",
      "Analyse IA des forces et axes d'amélioration",
      "Prise de décision Go / No-Go",
      "Co-construction du plan d'actions personnalisé",
      "Identification des prochaines étapes concrètes",
      "Orientation vers les ressources adaptées",
      "Clôture de l'entretien et planification du suivi",
    ],
  },
]

type InterviewStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED'

const colorMap: Record<string, { bg: string; text: string; border: string; progress: string; light: string; darkBg: string; darkText: string }> = {
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    progress: '[&>div]:bg-emerald-500',
    light: 'bg-emerald-50',
    darkBg: 'dark:bg-emerald-900/30',
    darkText: 'dark:text-emerald-400',
  },
  violet: {
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-200',
    progress: '[&>div]:bg-violet-500',
    light: 'bg-violet-50',
    darkBg: 'dark:bg-violet-900/30',
    darkText: 'dark:text-violet-400',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    progress: '[&>div]:bg-amber-500',
    light: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/30',
    darkText: 'dark:text-amber-400',
  },
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function getTimerColor(remaining: number, total: number): string {
  const ratio = remaining / total
  if (ratio > 0.5) return 'text-emerald-500'
  if (ratio > 0.25) return 'text-amber-500'
  return 'text-red-500'
}

function getTimerStroke(remaining: number, total: number): string {
  const ratio = remaining / total
  if (ratio > 0.5) return '#10b981'
  if (ratio > 0.25) return '#f59e0b'
  return '#ef4444'
}

export default function InterviewSession() {
  const [sessionMode, setSessionMode] = useState<SessionMode>('continuous')
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [status, setStatus] = useState<InterviewStatus>('NOT_STARTED')
  const [phaseElapsed, setPhaseElapsed] = useState(0)
  const [totalElapsed, setTotalElapsed] = useState(0)
  // Split mode: track completed sessions
  const [completedSessions, setCompletedSessions] = useState<Set<number>>(new Set())
  const [checklistState, setChecklistState] = useState<Record<string, boolean[]>>(() => {
    const initial: Record<string, boolean[]> = {}
    PHASES_BASE.forEach((phase) => {
      initial[phase.key] = phase.checklist.map(() => false)
    })
    return initial
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notesEndRef = useRef<HTMLDivElement>(null)

  // Compute PHASES based on mode
  const PHASES = useMemo(() => PHASES_BASE.map((phase) => ({
    ...phase,
    duration: sessionMode === 'continuous' ? phase.durationContinuous : phase.durationSplit,
  })), [sessionMode])

  const currentPhase = PHASES[currentPhaseIndex]
  const phaseDurationSeconds = currentPhase.duration * 60
  const phaseRemaining = Math.max(0, phaseDurationSeconds - phaseElapsed)
  const phaseProgress = (phaseElapsed / phaseDurationSeconds) * 100
  const colors = colorMap[currentPhase.color]

  // Reset everything when mode changes
  const handleModeChange = useCallback((newMode: SessionMode) => {
    if (newMode === sessionMode) return
    setSessionMode(newMode)
    setCurrentPhaseIndex(0)
    setStatus('NOT_STARTED')
    setPhaseElapsed(0)
    setTotalElapsed(0)
    setCompletedSessions(new Set())
    setChecklistState(() => {
      const initial: Record<string, boolean[]> = {}
      PHASES_BASE.forEach((phase) => {
        initial[phase.key] = phase.checklist.map(() => false)
      })
      return initial
    })
  }, [sessionMode])

  // Timer logic
  useEffect(() => {
    if (status === 'IN_PROGRESS') {
      intervalRef.current = setInterval(() => {
        setPhaseElapsed((prev) => prev + 1)
        setTotalElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [status])

  const toggleChecklistItem = (phaseKey: string, itemIndex: number) => {
    setChecklistState((prev) => ({
      ...prev,
      [phaseKey]: prev[phaseKey].map((checked, i) => (i === itemIndex ? !checked : checked)),
    }))
  }

  const goToPhase = useCallback(
    (direction: 'next' | 'prev') => {
      if (direction === 'next' && currentPhaseIndex < PHASES.length - 1) {
        setCurrentPhaseIndex((prev) => prev + 1)
        setPhaseElapsed(0)
      } else if (direction === 'prev' && currentPhaseIndex > 0) {
        setCurrentPhaseIndex((prev) => prev - 1)
        setPhaseElapsed(0)
      }
    },
    [currentPhaseIndex, PHASES.length]
  )

  const handleStart = () => setStatus('IN_PROGRESS')
  const handlePause = () => setStatus('PAUSED')
  const handleResume = () => setStatus('IN_PROGRESS')
  const handleComplete = () => setStatus('COMPLETED')

  // In split mode, complete current session and advance
  const handleCompleteSession = useCallback(() => {
    setCompletedSessions((prev) => new Set(prev).add(currentPhaseIndex))
    setStatus('COMPLETED')
    if (currentPhaseIndex < PHASES.length - 1) {
      // Auto-advance to next session
      setCurrentPhaseIndex((prev) => prev + 1)
      setPhaseElapsed(0)
      setStatus('NOT_STARTED')
    }
  }, [currentPhaseIndex, PHASES.length])

  // Start next session in split mode
  const handleNextSession = useCallback(() => {
    if (currentPhaseIndex < PHASES.length - 1) {
      setCompletedSessions((prev) => new Set(prev).add(currentPhaseIndex))
      setCurrentPhaseIndex((prev) => prev + 1)
      setPhaseElapsed(0)
      setStatus('NOT_STARTED')
    }
  }, [currentPhaseIndex, PHASES.length])

  const checkedCount = checklistState[currentPhase.key]?.filter(Boolean).length || 0
  const totalChecklist = currentPhase.checklist.length

  // Circular progress for timer
  const circumference = 2 * Math.PI * 54
  const phaseStrokeDashoffset = circumference - (phaseProgress / 100) * circumference

  const statusConfig: Record<InterviewStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    NOT_STARTED: { label: 'Non démarré', variant: 'outline', className: 'text-gray-500 border-gray-300' },
    IN_PROGRESS: { label: 'En cours', variant: 'default', className: 'bg-emerald-500 text-white' },
    PAUSED: { label: 'En pause', variant: 'secondary', className: 'bg-amber-100 text-amber-700' },
    COMPLETED: { label: 'Terminé', variant: 'default', className: 'bg-violet-500 text-white' },
  }

  const sc = statusConfig[status]

  // Split mode: check if all sessions are done
  const allSessionsCompleted = sessionMode === 'split' && completedSessions.size === PHASES.length
  // In split mode, the current phase is considered "completed" if it's in completedSessions
  const isCurrentSessionCompleted = sessionMode === 'split' && completedSessions.has(currentPhaseIndex)

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      {/* Mode Selector + Phase Progress Bar */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            {/* Session Mode Selector */}
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Session d&apos;entretien</h3>
              <Badge variant={sc.variant} className={`ml-auto text-xs ${sc.className}`}>
                {sc.label}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Mode :</span>
              <button
                onClick={() => handleModeChange('continuous')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  sessionMode === 'continuous'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                3h continue
              </button>
              <button
                onClick={() => handleModeChange('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  sessionMode === 'split'
                    ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-violet-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                3 × 1h
              </button>

              {/* Mode description badge */}
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {sessionMode === 'continuous'
                  ? '1 session de 3h — Phase 1: 45min, Phase 2: 75min, Phase 3: 60min'
                  : '3 sessions de 55min — Indépendantes'}
              </Badge>
            </div>

            {/* Split mode session counter */}
            {sessionMode === 'split' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4"
              >
                <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200 dark:bg-violet-900/20 dark:border-violet-800">
                  <div className="flex items-center gap-1.5">
                    {PHASES.map((_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                          i === currentPhaseIndex && !completedSessions.has(i)
                            ? 'bg-violet-600 text-white ring-2 ring-violet-300'
                            : completedSessions.has(i)
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {completedSessions.has(i) ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="ml-2 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Session {currentPhaseIndex + 1} sur {PHASES.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {completedSessions.size} terminée{completedSessions.size !== 1 ? 's' : ''} · {PHASES.length - completedSessions.size} restante{PHASES.length - completedSessions.size !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {!isCurrentSessionCompleted && currentPhaseIndex < PHASES.length - 1 && status !== 'NOT_STARTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNextSession}
                      className="rounded-xl gap-1.5 border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-400 text-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Session suivante
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Phase Stepper */}
            <div className="flex items-center gap-0 w-full mb-2">
              {PHASES.map((phase, i) => {
                const pColors = colorMap[phase.color]
                const isActive = i === currentPhaseIndex
                const isPast = sessionMode === 'continuous'
                  ? i < currentPhaseIndex
                  : completedSessions.has(i)
                return (
                  <div key={phase.key} className="flex items-center flex-1 last:flex-none">
                    <button
                      onClick={() => {
                        if (sessionMode === 'continuous') {
                          if (i <= currentPhaseIndex || status === 'NOT_STARTED') {
                            setCurrentPhaseIndex(i)
                            setPhaseElapsed(0)
                          }
                        } else {
                          // In split mode, can navigate to any phase
                          setCurrentPhaseIndex(i)
                          setPhaseElapsed(0)
                          if (completedSessions.has(i)) {
                            setStatus('COMPLETED')
                          } else if (status !== 'IN_PROGRESS' && status !== 'PAUSED') {
                            setStatus('NOT_STARTED')
                          }
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                        isActive && !isPast
                          ? `${pColors.bg} ${pColors.text} ${pColors.darkBg} ${pColors.darkText}`
                          : isPast
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                            : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isPast
                            ? 'bg-emerald-500 text-white'
                            : isActive
                              ? `${pColors.bg} ${pColors.text}`
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        }`}
                      >
                        {isPast ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className="hidden sm:inline">{phase.title}</span>
                      {sessionMode === 'split' && (
                        <span className="text-[10px] opacity-60 hidden sm:inline">({phase.duration}min)</span>
                      )}
                    </button>
                    {i < PHASES.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-1 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content: Left + Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Column: Phase Details & Checklist (60%) */}
        <motion.div variants={fadeIn} className="lg:col-span-3">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colors.bg.replace('100', '500')}`} />
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                  Phase {currentPhaseIndex + 1} — {currentPhase.title}
                </CardTitle>
                {sessionMode === 'split' && (
                  <Badge variant="outline" className="text-[10px] border-violet-200 text-violet-600 dark:border-violet-800 dark:text-violet-400">
                    Session {currentPhaseIndex + 1}/3
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{currentPhase.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {currentPhase.duration} min
                  {sessionMode === 'split' && ' (+ 5min buffer)'}
                </Badge>
                <Badge variant="outline" className={`text-xs ${colors.text}`}>
                  {checkedCount}/{totalChecklist} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress
                value={phaseProgress}
                className={`h-1.5 ${colors.progress}`}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Progression de la phase : {Math.round(phaseProgress)}%
              </p>

              {/* Checklist */}
              <div className="space-y-2 mt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPhase.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    {currentPhase.checklist.map((item, i) => {
                      const isChecked = checklistState[currentPhase.key]?.[i] || false
                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => toggleChecklistItem(currentPhase.key, i)}
                          className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                            isChecked
                              ? `${colors.light} dark:${colors.darkBg} border-transparent`
                              : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                          }`}
                        >
                          {isChecked ? (
                            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${colors.text} ${colors.darkText}`} />
                          ) : (
                            <Circle className="w-5 h-5 shrink-0 mt-0.5 text-gray-300 dark:text-gray-600" />
                          )}
                          <span
                            className={`text-sm ${
                              isChecked
                                ? 'text-gray-500 dark:text-gray-400 line-through'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {item}
                          </span>
                        </motion.button>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Phase Navigation */}
              {sessionMode === 'continuous' && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPhase('prev')}
                    disabled={currentPhaseIndex === 0}
                    className="rounded-xl gap-1.5"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    Phase précédente
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => goToPhase('next')}
                    disabled={currentPhaseIndex === PHASES.length - 1}
                    className={`rounded-xl gap-1.5 ${colors.bg} ${colors.text} hover:opacity-90`}
                  >
                    Phase suivante
                    <SkipForward className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Timer & Controls (40%) */}
        <motion.div variants={fadeIn} className="lg:col-span-2 space-y-4">
          {/* Timer Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${colors.text} ${colors.darkText}`} />
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">Chronomètre</CardTitle>
                {sessionMode === 'split' && (
                  <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 ml-auto">
                    Session {currentPhaseIndex + 1}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              {/* Circular Timer */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-gray-100 dark:text-gray-800"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={getTimerStroke(phaseRemaining, phaseDurationSeconds)}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={phaseStrokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${getTimerColor(phaseRemaining, phaseDurationSeconds)}`}>
                    {formatTime(phaseRemaining)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">restant</span>
                </div>
              </div>

              {/* Time Info */}
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Temps écoulé (phase)</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{formatTime(phaseElapsed)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Temps total écoulé</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{formatTime(totalElapsed)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Phase</span>
                  <span className={`font-semibold ${colors.text} ${colors.darkText}`}>
                    {currentPhaseIndex + 1} / {PHASES.length}
                  </span>
                </div>
              </div>

              {/* Status Controls */}
              <div className="w-full space-y-2 pt-2">
                {isCurrentSessionCompleted ? (
                  /* Current session already completed */
                  <div className="text-center space-y-2 py-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Session {currentPhaseIndex + 1} terminée !
                    </p>
                    {currentPhaseIndex < PHASES.length - 1 && (
                      <Button
                        onClick={handleNextSession}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Nouvelle session
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {status === 'NOT_STARTED' && (
                      <Button
                        onClick={handleStart}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {sessionMode === 'split'
                          ? `Démarrer la session ${currentPhaseIndex + 1}`
                          : "Démarrer l'entretien"}
                      </Button>
                    )}
                    {status === 'IN_PROGRESS' && (
                      <Button
                        onClick={handlePause}
                        variant="outline"
                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-xl gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Mettre en pause
                      </Button>
                    )}
                    {status === 'PAUSED' && (
                      <Button
                        onClick={handleResume}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Reprendre
                      </Button>
                    )}
                    {status !== 'NOT_STARTED' && status !== 'COMPLETED' && (
                      <Button
                        onClick={sessionMode === 'split' ? handleCompleteSession : handleComplete}
                        variant="outline"
                        className="w-full border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20 rounded-xl gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {sessionMode === 'split'
                          ? `Terminer la session ${currentPhaseIndex + 1}`
                          : "Terminer l'entretien"}
                      </Button>
                    )}
                  </>
                )}

                {allSessionsCompleted && (
                  <div className="text-center space-y-2 py-2 mt-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Toutes les sessions sont terminées !
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Durée totale : {formatTime(totalElapsed)}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSessionMode('split')
                        setCurrentPhaseIndex(0)
                        setStatus('NOT_STARTED')
                        setPhaseElapsed(0)
                        setTotalElapsed(0)
                        setCompletedSessions(new Set())
                        setChecklistState(() => {
                          const initial: Record<string, boolean[]> = {}
                          PHASES_BASE.forEach((phase) => {
                            initial[phase.key] = phase.checklist.map(() => false)
                          })
                          return initial
                        })
                      }}
                      className="mt-2 rounded-xl gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Réinitialiser
                    </Button>
                  </div>
                )}

                {status === 'COMPLETED' && sessionMode === 'continuous' && (
                  <div className="text-center space-y-2 py-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Entretien terminé !
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Durée totale : {formatTime(totalElapsed)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Phase Summary Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                Résumé {sessionMode === 'split' ? 'des sessions' : 'des phases'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PHASES.map((phase, i) => {
                const pColors = colorMap[phase.color]
                const phaseChecked = checklistState[phase.key]?.filter(Boolean).length || 0
                const phaseTotal = phase.checklist.length
                const pct = phaseTotal > 0 ? Math.round((phaseChecked / phaseTotal) * 100) : 0
                const isDone = sessionMode === 'split' ? completedSessions.has(i) : false
                return (
                  <div key={phase.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <div className={`w-2.5 h-2.5 rounded-full ${pColors.bg.replace('100', '500')}`} />
                        )}
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {phase.title}
                          {sessionMode === 'split' && ` (${phase.duration}min)`}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{phaseChecked}/{phaseTotal}</span>
                    </div>
                    <Progress
                      value={isDone ? 100 : pct}
                      className={`h-1 ${isDone ? '[&>div]:bg-emerald-500' : pColors.progress}`}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <div ref={notesEndRef} />
    </motion.div>
  )
}
