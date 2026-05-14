'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileBarChart,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  Target,
  TrendingUp,
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

interface ModuleStatus {
  name: string
  status: 'completed' | 'in_progress' | 'upcoming'
  score: number | null
  icon: typeof CheckCircle2
}

export default function SynthesePanel() {
  const userId = useAppStore((s) => s.userId)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([])
  const [synthesis, setSynthesis] = useState<{
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }>({ strengths: [], weaknesses: [], recommendations: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchProgress = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/dashboard/user-progress?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          const modules = data.modules || []

          const statuses: ModuleStatus[] = modules.map((m: { name: string; status: string; score: number }) => ({
            name: m.name,
            status: m.status === 'completed' ? 'completed' : m.status === 'in_progress' ? 'in_progress' : 'upcoming',
            score: m.score != null ? m.score : null,
            icon: m.status === 'completed' ? CheckCircle2 : m.status === 'in_progress' ? Clock : Clock,
          }))

          setModuleStatuses(statuses)

          // Derive synthesis from module scores
          const completed = statuses.filter((m) => m.status === 'completed')
          const highScores = completed.filter((m) => (m.score ?? 0) >= 75)
          const lowScores = completed.filter((m) => (m.score ?? 0) < 60 && (m.score ?? 0) > 0)

          const strengths = [
            ...(highScores.length > 0 ? [`Modules maîtrisés (${highScores.map((m) => m.name).join(', ')})`] : []),
            ...(completed.length >= 3 ? [`Parcours avancé : ${completed.length} modules complétés`] : []),
          ]

          const weaknesses = [
            ...(lowScores.length > 0 ? [`Axes d'amélioration identifiés (${lowScores.map((m) => `${m.name} (${m.score}/100)`).join(', ')})`] : []),
          ]

          const recommendations = [
            ...(lowScores.length > 0 ? [`Approfondir les modules en dessous de 60/100`] : []),
            ...(completed.length < modules.length ? ['Continuer les modules en cours pour compléter le diagnostic'] : []),
          ]

          setSynthesis({
            strengths: strengths.length > 0 ? strengths : ['Aucune force identifiée — complétez des modules pour débloquer l\'analyse'],
            weaknesses: weaknesses.length > 0 ? weaknesses : ['Aucune faiblesse identifiée'],
            recommendations: recommendations.length > 0 ? recommendations : ['Commencez par compléter les modules de diagnostic'],
          })
        }
      } catch {
        // Fallback: show empty state
        setModuleStatuses([])
        setSynthesis({
          strengths: [],
          weaknesses: [],
          recommendations: ['Connectez-vous pour voir votre synthèse de diagnostic'],
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgress()
  }, [userId])

  const completedModules = moduleStatuses.filter((m) => m.status === 'completed')
  const overallScore = completedModules.length > 0
    ? Math.round(completedModules.reduce((a, m) => a + (m.score || 0), 0) / completedModules.length)
    : 0

  const handleGenerate = async () => {
    if (!userId) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/livrables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DIAGNOSIS_REPORT',
          counselorId: userId,
          title: 'Rapport de synthèse',
        }),
      })
      if (res.ok) {
        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/livrables?counselorId=${userId}`)
            if (checkRes.ok) {
              const checkData = await checkRes.json()
              const report = (checkData.livrables || []).find(
                (l: { type: string; status: string }) => l.type === 'DIAGNOSIS_REPORT'
              )
              if (report && report.status === 'COMPLETED') {
                clearInterval(pollInterval)
                setIsGenerating(false)
                setGenerated(true)
              }
            }
          } catch { /* continue polling */ }
        }, 2000)
        // Fallback after 15s
        setTimeout(() => {
          clearInterval(pollInterval)
          setIsGenerating(false)
          setGenerated(true)
        }, 15000)
      } else {
        setIsGenerating(false)
      }
    } catch {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-500">Chargement de la synthèse...</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <FileBarChart className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Synthèse de diagnostic</h3>
                  <p className="text-sm text-gray-500">Vue consolidée de tous les modules</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{overallScore}/100</p>
                  <p className="text-xs text-gray-500">Score global</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progression par module */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Progression par module</CardTitle>
          </CardHeader>
          <CardContent>
            {moduleStatuses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">Aucun module enregistré. Commencez un diagnostic pour voir votre progression.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {moduleStatuses.map((mod) => (
                  <div key={mod.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <mod.icon className={`w-4 h-4 ${
                        mod.status === 'completed' ? 'text-emerald-500' :
                        mod.status === 'in_progress' ? 'text-amber-500' : 'text-gray-300'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">{mod.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {mod.score !== null && (
                        <Badge variant="secondary" className={`text-xs ${
                          mod.score >= 75 ? 'bg-emerald-50 text-emerald-700' :
                          mod.score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {mod.score}/100
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-[10px] ${
                        mod.status === 'completed' ? 'text-emerald-600 border-emerald-200' :
                        mod.status === 'in_progress' ? 'text-amber-600 border-amber-200' : 'text-gray-400 border-gray-200'
                      }`}>
                        {mod.status === 'completed' ? 'Terminé' : mod.status === 'in_progress' ? 'En cours' : 'À venir'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Forces / Faiblesses / Recommandations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forces */}
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Forces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {synthesis.strengths.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune force identifiée</p>
                ) : (
                  synthesis.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <ArrowRight className="w-3 h-3 text-emerald-500 mt-1 shrink-0" />
                      {s}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Faiblesses */}
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-4 h-4" /> Points de vigilance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {synthesis.weaknesses.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune faiblesse identifiée</p>
                ) : (
                  synthesis.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <AlertTriangle className="w-3 h-3 text-amber-500 mt-1 shrink-0" />
                      {w}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommandations */}
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-violet-700">
                <Lightbulb className="w-4 h-4" /> Recommandations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {synthesis.recommendations.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune recommandation</p>
                ) : (
                  synthesis.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Lightbulb className="w-3 h-3 text-violet-500 mt-1 shrink-0" />
                      {r}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Génération du rapport */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Générer le rapport de synthèse
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generated ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Rapport généré avec succès</span>
                </div>
                <p className="text-sm text-emerald-600">Synthese_diagnostic.pdf</p>
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" className="rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Télécharger PDF
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                    <Printer className="w-3.5 h-3.5 mr-1.5" /> Imprimer
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                    <Share2 className="w-3.5 h-3.5 mr-1.5" /> Partager
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-4">
                  Le rapport consolidera les résultats de tous les modules complétés en un document PDF exportable.
                </p>
                <Button onClick={handleGenerate} disabled={isGenerating} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                      </motion.div>
                      Analyse IA en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer la synthèse IA
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
