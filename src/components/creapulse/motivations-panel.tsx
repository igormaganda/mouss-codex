'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/hooks/use-store'
import {
  User,
  DollarSign,
  Heart,
  Flame,
  Lightbulb,
  RefreshCw,
  Briefcase,
  Shield,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Loader2,
  Target,
  BarChart3,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const MOTIVATION_TYPES = [
  { key: 'AUTONOMIE', label: 'Autonomie et indépendance', description: 'Être son propre patron, gérer son temps', icon: User },
  { key: 'REVENUS', label: 'Amélioration des revenus', description: 'Augmenter ses revenus ou créer de la richesse', icon: DollarSign },
  { key: 'IMPACT', label: 'Impact social / environnemental', description: 'Contribuer positivement à la société', icon: Heart },
  { key: 'PASSION', label: 'Passion et réalisation personnelle', description: 'Transformer une passion en métier', icon: Flame },
  { key: 'INNOVATION', label: 'Innovation et création', description: 'Créer quelque chose de nouveau', icon: Lightbulb },
  { key: 'RECONVERSION', label: 'Reconversion professionnelle', description: "Changer de métier ou de secteur", icon: RefreshCw },
  { key: 'NECESSITE', label: "Nécessité / Création d'emploi", description: "Créer son propre emploi faute d'autre opportunité", icon: Briefcase },
]

const BARRIER_TYPES = [
  { key: 'FINANCIER', label: 'Financier', description: "Manque de capital, difficultés d'accès au crédit", defaultLevel: 'high' as const },
  { key: 'COMPETENCES', label: 'Compétences', description: 'Manque de compétences techniques ou manageriales', defaultLevel: 'medium' as const },
  { key: 'FAMILIAL', label: 'Familial / Personnel', description: 'Soutien familial insuffisant, contraintes personnelles', defaultLevel: 'medium' as const },
  { key: 'MARCH', label: 'Marché', description: 'Marché saturé, concurrence forte, incertitude', defaultLevel: 'high' as const },
  { key: 'PSYCHOLOGIQUE', label: 'Psychologique', description: "Peur de l'échec, du jugement, stress", defaultLevel: 'medium' as const },
  { key: 'JURIDIQUE', label: 'Juridique / Administratif', description: 'Complexité administrative, réglementation', defaultLevel: 'low' as const },
  { key: 'TEMPORAL', label: 'Temps / Disponibilité', description: 'Disponibilité limitée, autres engagements', defaultLevel: 'low' as const },
]

const levelConfig = {
  low: { label: 'Faible', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', value: 1 },
  medium: { label: 'Moyen', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', value: 2 },
  high: { label: 'Élevé', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', value: 3 },
}

export default function MotivationsPanel() {
  const userId = useAppStore((s) => s.userId)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoadedRef = useRef(false)

  const [motivations, setMotivations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    MOTIVATION_TYPES.forEach((m) => { init[m.key] = 5 })
    return init
  })

  const [barriers, setBarriers] = useState<Record<string, { active: boolean; level: 'low' | 'medium' | 'high' }>>(() => {
    const init: Record<string, { active: boolean; level: 'low' | 'medium' | 'high' }> = {}
    BARRIER_TYPES.forEach((b) => { init[b.key] = { active: false, level: b.defaultLevel } })
    return init
  })

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeSection, setActiveSection] = useState<'motivations' | 'barriers' | 'alignment'>('motivations')

  // Fetch saved motivations/barriers from API on mount
  useEffect(() => {
    if (!userId) return
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/modules/motivations?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.data) {
            const saved = data.data as Record<string, unknown>
            if (saved.motivations && typeof saved.motivations === 'object') {
              setMotivations(saved.motivations as Record<string, number>)
            }
            if (saved.barriers && typeof saved.barriers === 'object') {
              setBarriers(saved.barriers as Record<string, { active: boolean; level: 'low' | 'medium' | 'high' }>)
            }
          }
        }
      } catch {
        // silent — fallback to defaults
      } finally {
        hasLoadedRef.current = true
      }
    }
    fetchData()
  }, [userId])

  // Debounced auto-save: persist motivations & barriers 1s after changes
  useEffect(() => {
    if (!userId || !hasLoadedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/modules/motivations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, motivations: { motivations, barriers } }),
      }).catch(() => { /* silent */ })
    }, 1000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [userId, motivations, barriers])

  const setMotivationValue = (key: string, value: number) => {
    setMotivations((prev) => ({ ...prev, [key]: value }))
  }

  const toggleBarrier = (key: string) => {
    setBarriers((prev) => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active },
    }))
  }

  const setBarrierLevel = (key: string, level: 'low' | 'medium' | 'high') => {
    setBarriers((prev) => ({
      ...prev,
      [key]: { ...prev[key], level },
    }))
  }

  // Alignment score calculation
  const avgMotivation = Object.values(motivations).reduce((sum, v) => sum + v, 0) / MOTIVATION_TYPES.length
  const activeBarrierCount = Object.values(barriers).filter((b) => b.active).length
  const avgBarrierSeverity = activeBarrierCount > 0
    ? Object.values(barriers).filter((b) => b.active).reduce((sum, b) => sum + levelConfig[b.level].value, 0) / activeBarrierCount
    : 0
  const alignmentScore = Math.max(0, Math.min(100, Math.round(
    ((avgMotivation / 10) * 70) - (avgBarrierSeverity / 3) * 30
  )))

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const motivationSummary = MOTIVATION_TYPES.map((m) => `${m.label}: ${motivations[m.key]}/10`).join('\n')
      const barrierSummary = BARRIER_TYPES.filter((b) => barriers[b.key].active).map((b) => `${b.label}: ${levelConfig[barriers[b.key].level].label}`).join('\n') || 'Aucun frein identifié'

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `En tant qu'expert en création d'entreprise, analyse ce profil de porteur de projet et donne des recommandations personnalisées en français:\n\nMOTIVATIONS:\n${motivationSummary}\n\nFREINS IDENTIFIÉS:\n${barrierSummary}\n\nScore d'alignement: ${alignmentScore}/100\n\nFournis une analyse structurée avec: 1) Forces motivationnelles, 2) Points de vigilance, 3) Recommandations d'accompagnement.`,
            },
          ],
          context: { userName: 'Conseiller CréaScope', userRole: 'COUNSELOR' },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAiAnalysis(data.content)
      }
    } catch {
      // silent
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-emerald-100 dark:bg-emerald-900/30'
    if (score >= 40) return 'bg-amber-100 dark:bg-amber-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Favorable'
    if (score >= 40) return 'À évaluer'
    return 'Risqué'
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      {/* Section Tabs */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Motivations & Freins</h3>
              <Badge variant="outline" className="ml-auto text-xs">
                Score : <span className={`font-bold ml-1 ${getScoreColor(alignmentScore)}`}>{alignmentScore}%</span>
              </Badge>
            </div>

            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {(['motivations', 'barriers', 'alignment'] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    activeSection === section
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {section === 'motivations' && <Flame className="w-3.5 h-3.5" />}
                  {section === 'barriers' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {section === 'alignment' && <BarChart3 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">
                    {section === 'motivations' ? 'Motivations' : section === 'barriers' ? 'Freins' : 'Alignement'}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Motivations Section */}
      {activeSection === 'motivations' && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-3">
          {MOTIVATION_TYPES.map((motivation, i) => {
            const Icon = motivation.icon
            const value = motivations[motivation.key]
            return (
              <motion.div key={motivation.key} variants={fadeIn}>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{motivation.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{motivation.description}</p>
                          </div>
                          <span className={`text-lg font-bold min-w-[2.5rem] text-right ${
                            value >= 8 ? 'text-emerald-600 dark:text-emerald-400'
                              : value >= 5 ? 'text-amber-600 dark:text-amber-400'
                              : 'text-gray-400'
                          }`}>
                            {value}
                          </span>
                        </div>
                        <Slider
                          value={[value]}
                          onValueChange={(v) => setMotivationValue(motivation.key, v[0])}
                          min={0}
                          max={10}
                          step={1}
                          className="w-full [&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
                        />
                        <div className="flex justify-between text-[10px] text-gray-300 dark:text-gray-600">
                          <span>0 — Pas du tout</span>
                          <span>10 — Très fort</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Barriers Section */}
      {activeSection === 'barriers' && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-3">
          {BARRIER_TYPES.map((barrier) => {
            const state = barriers[barrier.key]
            const lc = levelConfig[state.level]
            return (
              <motion.div key={barrier.key} variants={fadeIn}>
                <Card className={`border-0 shadow-sm transition-all ${state.active ? 'opacity-100' : 'opacity-60'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        state.active ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${state.active ? 'text-red-500' : 'text-gray-400 dark:text-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{barrier.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{barrier.description}</p>
                          </div>
                          <Switch
                            checked={state.active}
                            onCheckedChange={() => toggleBarrier(barrier.key)}
                          />
                        </div>

                        {state.active && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex items-center gap-2 pt-1"
                          >
                            <span className="text-xs text-gray-500 dark:text-gray-400">Sévérité :</span>
                            {(['low', 'medium', 'high'] as const).map((level) => (
                              <button
                                key={level}
                                onClick={() => setBarrierLevel(barrier.key, level)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                  state.level === level
                                    ? levelConfig[level].color
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                }`}
                              >
                                {levelConfig[level].label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Alignment Section */}
      {activeSection === 'alignment' && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
          {/* Score Card */}
          <motion.div variants={fadeIn}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 flex flex-col items-center space-y-4">
                <div className={`w-28 h-28 rounded-full ${getScoreBg(alignmentScore)} flex items-center justify-center`}>
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${getScoreColor(alignmentScore)}`}>{alignmentScore}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">/ 100</p>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Score d&apos;alignement
                  </p>
                  <Badge variant="outline" className={getScoreColor(alignmentScore)}>
                    {getScoreLabel(alignmentScore)}
                  </Badge>
                </div>

                {/* Breakdown */}
                <div className="w-full grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {avgMotivation.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Motivation moyenne</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/10">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {activeBarrierCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Freins actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Motivation Bars */}
          <motion.div variants={fadeIn}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-900 dark:text-gray-100">Détail des motivations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {MOTIVATION_TYPES.map((m) => {
                  const value = motivations[m.key]
                  return (
                    <div key={m.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{m.label}</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{value}/10</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value * 10}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            value >= 8 ? 'bg-emerald-500' : value >= 5 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Analysis */}
          <motion.div variants={fadeIn}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  <CardTitle className="text-sm text-gray-900 dark:text-gray-100">Analyse IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="w-full rounded-xl gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isAnalyzing ? 'Analyse en cours...' : 'Recommandation IA'}
                </Button>

                {aiAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-emerald-50 border border-violet-200/50 dark:from-violet-900/20 dark:to-emerald-900/20 dark:border-violet-800/50"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                      <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                        Analyse IA
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {aiAnalysis}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
