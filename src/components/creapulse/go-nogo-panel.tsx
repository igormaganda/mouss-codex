'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  FileText,
  MessageSquare,
  Clock,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

interface Criterion {
  id: string
  label: string
  weight: number
  score: number // 0-5
  description: string
}

const defaultCriteria: Criterion[] = [
  { id: 'market', label: 'Adéquation marché', weight: 20, score: 0, description: 'La demande existe-t-elle ? Le marché est-il porteur ?' },
  { id: 'skills', label: 'Compétences du porteur', weight: 20, score: 0, description: 'Le porteur a-t-il les compétences nécessaires ?' },
  { id: 'financial', label: 'Viabilité financière', weight: 25, score: 0, description: 'Le modèle économique est-il viable ?' },
  { id: 'motivation', label: 'Motivation et engagement', weight: 15, score: 0, description: 'Le porteur est-il engagé sur la durée ?' },
  { id: 'network', label: 'Réseau et appuis', weight: 10, score: 0, description: 'Le porteur dispose-t-il d\'un réseau professionnel ?' },
  { id: 'risk', label: 'Niveau de risque', weight: 10, score: 0, description: 'Les risques sont-ils maîtrisables ?' },
]

export default function GoNoGoPanel() {
  const userId = useAppStore((s) => s.userId)
  const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria)
  const [decision, setDecision] = useState<'GO' | 'NO_GO' | null>(null)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Fetch existing evaluation on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchEvaluation = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/go-nogo?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.evaluation) {
            // Restore criteria scores from saved evaluation (normalized from 0-10 to 0-5)
            if (data.evaluation.criteria && data.evaluation.criteria.length > 0) {
              const restoredCriteria = data.evaluation.criteria.map((c: { id: string; score: number }) => {
                const base = defaultCriteria.find((d) => d.id === c.id)
                if (base) {
                  return { ...base, score: Math.min(5, Math.round(c.score / 2)) }
                }
                return null
              }).filter(Boolean) as Criterion[]
              if (restoredCriteria.length > 0) {
                setCriteria(restoredCriteria)
              }
            }
            if (data.evaluation.decision) {
              setDecision(data.evaluation.decision)
            }
            if (data.evaluation.reason) {
              setReason(data.evaluation.reason)
            }
          }
        }
      } catch {
        // Silently fail — user starts with default empty criteria
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvaluation()
  }, [userId])

  const weightedScore = criteria.reduce((acc, c) => acc + (c.score * c.weight) / 5, 0)
  const maxScore = criteria.reduce((acc, c) => acc + c.weight, 0)
  const scorePercent = (weightedScore / maxScore) * 100
  const autoRecommendation = scorePercent >= 65 ? 'GO' : 'NO_GO'

  const updateScore = (id: string, score: number) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, score } : c)))
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600'
    if (score >= 3) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-emerald-50'
    if (score >= 3) return 'bg-amber-50'
    return 'bg-red-50'
  }

  const handleValidate = useCallback(async () => {
    if (!decision || !reason.trim() || !userId) return
    setIsSaving(true)
    setSaveError('')
    try {
      const apiCriteria = criteria.map((c) => ({
        id: c.id,
        label: c.label,
        score: c.score * 2, // Convert 0-5 to 0-10
        weight: c.weight / 100, // Convert percentage to 0-1
      }))

      const res = await fetch('/api/go-nogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: userId,
          criteria: apiCriteria,
          decision: decision === 'GO' ? 'go' : 'nogo',
          comments: reason.trim(),
        }),
      })

      if (res.ok) {
        // Success — decision saved
      } else {
        setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.')
      }
    } catch {
      setSaveError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsSaving(false)
    }
  }, [decision, reason, userId, criteria])

  if (isLoading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-500">Chargement de l&apos;évaluation...</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header + Score global */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Décision Go / No-Go</h3>
                  <p className="text-sm text-gray-500">Évaluez la viabilité du projet entrepreneurial</p>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${scorePercent >= 65 ? 'text-emerald-600' : scorePercent >= 45 ? 'text-amber-600' : 'text-red-600'}`}>
                  {scorePercent.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">Score pondéré</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Critères pondérés */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Critères d&apos;évaluation
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={scorePercent >= 65 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                  Recommandation IA : {autoRecommendation === 'GO' ? 'FAVORABLE' : 'DÉFAVORABLE'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criteria.map((criterion) => (
                <div key={criterion.id} className={`p-4 rounded-xl border ${getScoreBg(criterion.score)} border-gray-100`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900">{criterion.label}</p>
                        <Badge variant="outline" className="text-[10px]">Pondération: {criterion.weight}%</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{criterion.description}</p>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColor(criterion.score)}`}>{criterion.score}/5</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateScore(criterion.id, s)}
                        className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
                          s <= criterion.score
                            ? s >= 4
                              ? 'bg-emerald-500 text-white'
                              : s >= 3
                                ? 'bg-amber-400 text-white'
                                : 'bg-red-400 text-white'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Décision */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-500" />
              Verdict du conseiller
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDecision('GO')}
                className={`p-6 rounded-xl border-2 transition-all text-center ${
                  decision === 'GO'
                    ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-emerald-200'
                }`}
              >
                <CheckCircle2 className={`w-10 h-10 mx-auto mb-2 ${decision === 'GO' ? 'text-emerald-500' : 'text-gray-300'}`} />
                <p className={`font-bold ${decision === 'GO' ? 'text-emerald-700' : 'text-gray-500'}`}>GO</p>
                <p className="text-xs text-gray-400">Projet viable</p>
              </button>
              <button
                onClick={() => setDecision('NO_GO')}
                className={`p-6 rounded-xl border-2 transition-all text-center ${
                  decision === 'NO_GO'
                    ? 'bg-red-50 border-red-400 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-red-200'
                }`}
              >
                <XCircle className={`w-10 h-10 mx-auto mb-2 ${decision === 'NO_GO' ? 'text-red-500' : 'text-gray-300'}`} />
                <p className={`font-bold ${decision === 'NO_GO' ? 'text-red-700' : 'text-gray-500'}`}>NO-GO</p>
                <p className="text-xs text-gray-400">Projet non viable</p>
              </button>
            </div>

            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Justification de la décision (obligatoire)..."
              className="rounded-xl min-h-[100px]"
            />

            {saveError && (
              <p className="text-sm text-red-500">{saveError}</p>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleValidate}
                disabled={!decision || !reason.trim() || isSaving}
                className={`rounded-xl font-semibold ${
                  decision === 'GO'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sauvegarde...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Valider la décision {decision === 'GO' ? 'GO' : 'NO-GO'}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
