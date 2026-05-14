'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileCheck,
  Printer,
  Save,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  Download,
  AlertTriangle,
  TrendingUp,
  Target,
  Compass,
  Heart,
  Scale,
  DollarSign,
  Eye,
  ThumbsUp,
  Clock,
  User,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// ====================== TYPES ======================
interface ReportData {
  porteur: {
    nom: string
    date: string
    conseiller: string
  }
  modules: {
    riasec: { dominant: string; score: number; description: string }
    kiviat: { score: number; details: string }
    motivations: { score: number; top3: string[] }
    marche: { confidence: number; secteur: string }
    financier: { result: string; tresorerieInitiale: string }
    goNoGo: { decision: string; score: number; label: string }
  }
  phases: Array<{ name: string; completed: boolean; items: number; total: number }>
  notesHighlights: string[]
}

/** Generate recommendations dynamically from module scores */
function buildRecommendations(d: ReportData): string[] {
  const recs: string[] = []
  if (d.modules.riasec.score < 60)
    recs.push('Approfondir l\'orientation professionnelle via le module RIASEC')
  if (d.modules.kiviat.score < 50)
    recs.push('Développer les compétences clés identifiées par le profil Kiviat')
  if (d.modules.motivations.score < 50)
    recs.push('Explorer et renforcer les motivations entrepreneuriales')
  if (d.modules.marche.confidence < 40)
    recs.push('Réaliser une étude de marché approfondie sur le secteur visé')
  if (d.modules.financier.result === 'En attente' || d.modules.financier.result === '—')
    recs.push('Établir un prévisionnel financier avec un expert-comptable')
  if (d.modules.goNoGo.decision !== 'GO')
    recs.push('Travailler les critères d\'évaluation pour obtenir une décision GO')
  const incompletePhases = d.phases.filter((p) => !p.completed)
  if (incompletePhases.length > 0)
    recs.push(`Poursuivre la complétion de la phase « ${incompletePhases[0].name} »`)
  recs.push('Rencontrer votre conseiller Echo Entreprendre pour valider les résultats et construire votre feuille de route')
  return recs
}

// ====================== COMPONENT ======================
export default function SynthesisPanel() {
  const userId = useAppStore((s) => s.userId)
  const userName = useAppStore((s) => s.userName)
  const reportRef = useRef<HTMLDivElement>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [aiSynthesis, setAiSynthesis] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedType, setSavedType] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(true)

  // Fetch real data from APIs on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchReportData = async () => {
      setIsLoading(true)
      try {
        const [progressRes, riasecRes, kiviatRes, motivationsRes, goNoGoRes, livrablesRes, counselorRes] =
          await Promise.allSettled([
            fetch(`/api/dashboard/user-progress?userId=${userId}`).then((r) => r.json()),
            fetch(`/api/modules/riasec?userId=${userId}`).then((r) => r.json()),
            fetch(`/api/modules/kiviat?userId=${userId}`).then((r) => r.json()),
            fetch(`/api/modules/motivations?userId=${userId}`).then((r) => r.json()),
            fetch(`/api/go-nogo?userId=${userId}`).then((r) => r.json()),
            fetch(`/api/livrables?counselorId=${userId}`).then((r) => r.json()),
            fetch(`/api/dashboard/counselor/${userId}`).then((r) => (r.ok ? r.json() : null)),
          ])

        // Safely extract fulfilled results
        const progress = progressRes.status === 'fulfilled' ? progressRes.value : null
        const riasecData = riasecRes.status === 'fulfilled' && Array.isArray(riasecRes.value) ? riasecRes.value : []
        const kiviatData = kiviatRes.status === 'fulfilled' && Array.isArray(kiviatRes.value) ? kiviatRes.value : []
        const motivationsData = motivationsRes.status === 'fulfilled' ? motivationsRes.value : null
        const goNoGoData = goNoGoRes.status === 'fulfilled' ? goNoGoRes.value : null
        const livrablesData = livrablesRes.status === 'fulfilled' ? livrablesRes.value : null
        const counselorData = counselorRes.status === 'fulfilled' ? counselorRes.value : null

        // === RIASEC ===
        const dominantRiasec = riasecData.find((r: { isDominant: boolean }) => r.isDominant)
        const riasecScore = dominantRiasec?.score || (riasecData.length > 0 ? Math.round(riasecData.reduce((sum: number, r: { score: number }) => sum + r.score, 0) / riasecData.length) : 0)
        const profileNames: Record<string, string> = { R: 'Réaliste', I: 'Investigateur', A: 'Artistique', S: 'Social', E: 'Entrepreneurial', C: 'Conventionnel' }
        const dominantType = dominantRiasec?.profileType || ''
        const dominantLabel = profileNames[dominantType] || dominantType
        const sorted = [...riasecData].sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        const topTypes = sorted.slice(0, 2).map((r: { profileType: string }) => r.profileType).join('-')

        // === Kiviat ===
        const kiviatScore = kiviatData.length > 0 ? Math.round(kiviatData.reduce((sum: number, r: { value: number }) => sum + r.value, 0) / kiviatData.length) : 0
        const kiviatDetails = kiviatData.map((r: { dimension: string; value: number }) => `${r.dimension} ${r.value}`).join(', ')

        // === Motivations ===
        const motivationsJson = (motivationsData?.data && typeof motivationsData.data === 'object' ? motivationsData.data : {}) as Record<string, unknown>
        const motivationsScore = (motivationsData?.score as number) || 0
        const rawTop3 = motivationsJson.top3 || (Array.isArray(motivationsJson.motivations) ? (motivationsJson.motivations as unknown[]).slice(0, 3) : null) || ['Données en attente']
        const motivationsTop3 = Array.isArray(rawTop3) ? rawTop3.map(String) : [String(rawTop3)]

        // === Go/No-Go ===
        const evaluation = goNoGoData?.evaluation as { decision?: string; criteria?: { score: number; weight: number }[] } | null
        const goNoGoDecision = evaluation?.decision || 'PENDING_REVIEW'
        let goNoGoScore = 50
        if (evaluation?.criteria && evaluation.criteria.length > 0) {
          const totalWeight = evaluation.criteria.reduce((s: number, c: { weight: number }) => s + c.weight, 0)
          goNoGoScore = totalWeight > 0 ? Math.round((evaluation.criteria.reduce((s: number, c: { score: number; weight: number }) => s + c.score * c.weight, 0) / totalWeight) * 10) : 50
        } else if (goNoGoDecision === 'GO') goNoGoScore = 75
        else if (goNoGoDecision === 'NO_GO') goNoGoScore = 35
        const goNoGoLabels: Record<string, string> = { GO: 'Projet viable', NO_GO: 'Projet à retravailler', PENDING_REVIEW: 'En attente de décision' }

        // === Marché ===
        const marcheModule = progress?.modules?.find((m: { name: string }) => m.name === 'MARCHE' || m.name === 'marche')
        const marcheConfidence = marcheModule?.score || 0
        const marcheSecteur = marcheModule?.description || 'Analyse en cours'

        // === Financier ===
        const financierLivrable = livrablesData?.livrables?.find((l: { type: string }) => l.type === 'FINANCIAL_FORECAST')
        const financierResult = financierLivrable ? 'Prévisionnel disponible' : 'En attente'
        const financierTresorerie = '—'

        // === Phases ===
        const modules = progress?.modules || []
        const completedCount = modules.filter((m: { status: string }) => m.status === 'completed').length
        const totalModules = modules.length || 8
        const phases = [
          { name: 'Phase 1 — Accueil & Profil', completed: completedCount >= 2, items: completedCount, total: totalModules },
          { name: 'Phase 2 — Diagnostic Approfondi', completed: completedCount >= 5, items: Math.min(completedCount, 5), total: 6 },
          { name: 'Phase 3 — Synthèse & Feuille de route', completed: completedCount === totalModules && totalModules > 0, items: completedCount >= 6 ? completedCount - 5 : 0, total: 3 },
        ]

        // === Notes highlights ===
        const highlights: string[] = []
        if (riasecScore > 60) highlights.push(`Orientation RIASEC confirmée (${topTypes || dominantLabel})`)
        if (kiviatScore > 60) highlights.push(`Compétences clés identifiées (score Kiviat ${kiviatScore}/100)`)
        if (motivationsScore > 50) highlights.push('Motivation entrepreneuriale positive')
        if (goNoGoDecision === 'GO') highlights.push('Décision GO — projet jugé viable')
        if (completedCount > 0) highlights.push(`${completedCount} module(s) complété(s) sur ${totalModules}`)
        if (highlights.length === 0) highlights.push('Diagnostic en cours — données partielles')

        // === Counselor ===
        const counselorUserName = counselorData?.counselor?.user?.name
        const conseillerName = counselorUserName || 'Conseiller Echo Entreprendre'

        const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

        setReportData({
          porteur: { nom: userName || 'Porteur de projet', date: today, conseiller: conseillerName },
          modules: {
            riasec: { dominant: topTypes || dominantLabel || 'N/A', score: riasecScore, description: dominantLabel || 'Non déterminé' },
            kiviat: { score: kiviatScore, details: kiviatDetails || 'Données non disponibles' },
            motivations: { score: motivationsScore, top3: motivationsTop3 },
            marche: { confidence: marcheConfidence, secteur: marcheSecteur },
            financier: { result: financierResult, tresorerieInitiale: financierTresorerie },
            goNoGo: { decision: goNoGoDecision, score: goNoGoScore, label: goNoGoLabels[goNoGoDecision] || goNoGoDecision },
          },
          phases,
          notesHighlights: highlights,
        })
      } catch {
        // On error, set minimal report data
        const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        setReportData({
          porteur: { nom: userName || 'Porteur de projet', date: today, conseiller: 'Conseiller Echo Entreprendre' },
          modules: {
            riasec: { dominant: 'N/A', score: 0, description: 'Données non disponibles' },
            kiviat: { score: 0, details: 'Données non disponibles' },
            motivations: { score: 0, top3: ['En attente'] },
            marche: { confidence: 0, secteur: '—' },
            financier: { result: 'En attente', tresorerieInitiale: '—' },
            goNoGo: { decision: 'PENDING_REVIEW', score: 0, label: 'En attente' },
          },
          phases: [
            { name: 'Phase 1 — Accueil & Profil', completed: false, items: 0, total: 6 },
            { name: 'Phase 2 — Diagnostic Approfondi', completed: false, items: 0, total: 8 },
            { name: 'Phase 3 — Synthèse & Feuille de route', completed: false, items: 0, total: 7 },
          ],
          notesHighlights: ['Données en cours de chargement'],
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [userId, userName])

  const generateAISynthesis = useCallback(async () => {
    if (!reportData) return
    setIsGeneratingAI(true)
    setAiSynthesis('')
    try {
      const d = reportData
      const prompt = `Génère une synthèse complète de diagnostic entrepreneurial en français pour le rapport suivant.
Sois professionnel, structuré et concis (environ 300 mots). Inclus des recommandations concrètes.

**Porteur**: ${d.porteur.nom}
**Date**: ${d.porteur.date}
**RIASEC dominant**: ${d.modules.riasec.dominant} (${d.modules.riasec.score}%) — ${d.modules.riasec.description}
**Score Kiviat**: ${d.modules.kiviat.score}/100 — ${d.modules.kiviat.details}
**Motivations**: ${d.modules.motivations.score}% — Top 3: ${d.modules.motivations.top3.join(', ')}
**Marché**: Confiance ${d.modules.marche.confidence}% — Secteur ${d.modules.marche.secteur}
**Financier**: ${d.modules.financier.result} — Trésorerie initiale ${d.modules.financier.tresorerieInitiale}
**Go/No-Go**: ${d.modules.goNoGo.decision} (${d.modules.goNoGo.score}/100) — ${d.modules.goNoGo.label}
**Notes clés**: ${d.notesHighlights.join('; ')}
**Avancement phases**: ${d.phases.map((p) => `${p.name}: ${p.items}/${p.total}`).join(', ')}

Génère la synthèse structurée avec : 1) Profil entrepreneurial, 2) Forces et axes d'amélioration, 3) Recommandations.`

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: { userName: 'Conseiller Echo Entreprendre', userRole: 'COUNSELOR' },
        }),
      })
      const data = await res.json()
      if (res.ok) setAiSynthesis(data.content)
      else setAiSynthesis('Erreur lors de la génération.')
    } catch {
      setAiSynthesis('Erreur de connexion.')
    } finally {
      setIsGeneratingAI(false)
    }
  }, [reportData])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleSaveLivrable = useCallback(
    async (type: 'CERTIFICATE' | 'DIAGNOSIS_REPORT') => {
      if (!reportData) return
      setIsSaving(true)
      try {
        const d = reportData
        const res = await fetch('/api/livrables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            counselorId: userId,
            type,
            title: type === 'CERTIFICATE'
              ? `Certificat de diagnostic — ${d.porteur.nom}`
              : `Rapport de diagnostic — ${d.porteur.nom}`,
            content: {
              reportData: d,
              aiSynthesis,
              generatedAt: new Date().toISOString(),
            },
          }),
        })
        if (res.ok) {
          setSavedType(type)
          setTimeout(() => setSavedType(null), 4000)
        }
      } catch {
        /* silent */
      } finally {
        setIsSaving(false)
      }
    },
    [reportData, aiSynthesis, userId]
  )

  const goNoGoConfig = {
    GO: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
    NO_GO: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
    PENDING_REVIEW: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  }
  const gng = reportData ? (goNoGoConfig[reportData.modules.goNoGo.decision as keyof typeof goNoGoConfig] || goNoGoConfig.PENDING_REVIEW) : goNoGoConfig.PENDING_REVIEW

  if (isLoading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Synthèse & Rapport</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mr-3" />
              <span className="text-sm text-gray-500">Chargement des données du rapport...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!reportData) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Synthèse & Rapport</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-16">
              <p className="text-sm text-gray-400">Connectez-vous pour accéder au rapport de diagnostic.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const recommendations = buildRecommendations(reportData)

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      {/* Actions Bar */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Synthèse & Rapport</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Générez, consultez et exportez le rapport de diagnostic complet.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={generateAISynthesis}
                disabled={isGeneratingAI}
                variant="outline"
                className="rounded-xl gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20"
              >
                {isGeneratingAI ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Génération IA...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />Synthèse IA</>
                )}
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="rounded-xl gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Printer className="w-4 h-4" />
                Exporter PDF
              </Button>
              <Button
                onClick={() => handleSaveLivrable('DIAGNOSIS_REPORT')}
                disabled={isSaving}
                variant="outline"
                className="rounded-xl gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder rapport
              </Button>
              <Button
                onClick={() => handleSaveLivrable('CERTIFICATE')}
                disabled={isSaving}
                variant="outline"
                className="rounded-xl gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Certificat
              </Button>
            </div>
            {savedType && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-emerald-600 dark:text-emerald-400 mt-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                {savedType === 'CERTIFICATE' ? 'Certificat' : 'Rapport de diagnostic'} sauvegardé avec succès dans les livrables.
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Synthesis Preview */}
      {aiSynthesis && (
        <motion.div variants={fadeIn} className="print:hidden">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-900/20 dark:to-emerald-900/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <CardTitle className="text-base">Synthèse IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {aiSynthesis}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Report Content (printable) */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm print:shadow-none print:border print:border-gray-300 print:rounded-none">
          <div ref={reportRef} className="creapulse-report">
            {/* Report Header */}
            <div className="p-6 sm:p-8 print:p-8 border-b border-gray-100 dark:border-gray-800 print:border-gray-300">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 print:text-gray-900 print:dark:text-gray-900">
                    Rapport de Diagnostic Entrepreneurial
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600 mt-1">
                    Plateforme Echo Entreprendre — Diagnostic complet
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={`${gng.color} ${gng.bg} border ${gng.border} print:border-gray-300`}>
                    <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                    {reportData.modules.goNoGo.label}
                  </Badge>
                  <p className="text-xs text-gray-400 dark:text-gray-500 print:text-gray-500 mt-1">
                    {reportData.modules.goNoGo.score}/100
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 sm:p-8 print:p-8 space-y-6">
              {/* Porteur Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 print:text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  Informations du porteur
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 print:bg-gray-50 print:dark:bg-gray-50">
                    <p className="text-xs text-gray-400 print:text-gray-500">Nom</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 print:text-gray-900">{reportData.porteur.nom}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 print:bg-gray-50 print:dark:bg-gray-50">
                    <p className="text-xs text-gray-400 print:text-gray-500">Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 print:text-gray-900">{reportData.porteur.date}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 print:bg-gray-50 print:dark:bg-gray-50">
                    <p className="text-xs text-gray-400 print:text-gray-500">Conseiller</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 print:text-gray-900">{reportData.porteur.conseiller}</p>
                  </div>
                </div>
              </div>

              <Separator className="dark:bg-gray-800 print:bg-gray-300" />

              {/* Module Results */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 print:text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Résultats des modules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* RIASEC */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 print:border-gray-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-800">RIASEC</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-violet-600 dark:text-violet-400 print:text-violet-600">{reportData.modules.riasec.score}%</span>
                      <Badge variant="secondary" className="text-xs">{reportData.modules.riasec.dominant}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">{reportData.modules.riasec.description}</p>
                  </div>

                  {/* Kiviat */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 print:border-gray-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-800">Kiviat</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-600">{reportData.modules.kiviat.score}</span>
                      <span className="text-xs text-gray-400">/100</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">{reportData.modules.kiviat.details}</p>
                  </div>

                  {/* Motivations */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 print:border-gray-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-800">Motivations</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 print:text-rose-600">{reportData.modules.motivations.score}%</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">Top 3 : {reportData.modules.motivations.top3.join(', ')}</p>
                  </div>

                  {/* Marché */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 print:border-gray-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-800">Marché</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 print:text-amber-600">{reportData.modules.marche.confidence}%</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">Confiance — {reportData.modules.marche.secteur}</p>
                  </div>

                  {/* Financier */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 print:border-gray-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-teal-500" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-800">Financier</span>
                    </div>
                    <p className="text-lg font-bold text-teal-600 dark:text-teal-400 print:text-teal-600">{reportData.modules.financier.result}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">Trésorerie : {reportData.modules.financier.tresorerieInitiale}</p>
                  </div>

                  {/* Go/No-Go */}
                  <div className={`p-4 rounded-xl border ${gng.border} ${gng.bg} space-y-2`}>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-gray-800">Go / No-Go</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${gng.color}`}>{reportData.modules.goNoGo.decision}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">({reportData.modules.goNoGo.score}/100)</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">{reportData.modules.goNoGo.label}</p>
                  </div>
                </div>
              </div>

              <Separator className="dark:bg-gray-800 print:bg-gray-300" />

              {/* Phase Checklist Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 print:text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  Avancement des phases d&apos;entretien
                </h3>
                <div className="space-y-2">
                  {reportData.phases.map((phase, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 print:border-gray-300"
                    >
                      <div className="flex items-center gap-2">
                        {phase.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-800">{phase.name}</span>
                      </div>
                      <Badge
                        variant={phase.completed ? 'default' : 'outline'}
                        className={`text-xs ${phase.completed ? 'bg-emerald-500 text-white' : 'text-gray-400'}`}
                      >
                        {phase.items}/{phase.total}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="dark:bg-gray-800 print:bg-gray-300" />

              {/* Notes Highlights */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 print:text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Points clés identifiés
                </h3>
                <div className="space-y-2">
                  {reportData.notesHighlights.map((note, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 print:bg-emerald-50 print:dark:bg-emerald-50 border border-emerald-100 dark:border-emerald-800/50 print:border-emerald-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-800">{note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Synthesis in report (for print) */}
              {aiSynthesis && (
                <>
                  <Separator className="dark:bg-gray-800 print:bg-gray-300" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 print:text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      Synthèse IA
                    </h3>
                    <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 print:bg-violet-50 print:dark:bg-violet-50 border border-violet-100 dark:border-violet-800/50 print:border-violet-200">
                      <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {aiSynthesis}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 print:text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Recommandations
                </h3>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 print:bg-amber-50 print:dark:bg-amber-50 border border-amber-100 dark:border-amber-800/50 print:border-amber-200"
                    >
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 print:text-amber-600 mt-0.5 shrink-0">{i + 1}.</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-800">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 print:border-gray-300">
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 print:text-gray-500">
                  <span>Rapport généré par Echo Entreprendre</span>
                  <span>{reportData.porteur.date}</span>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .creapulse-report,
          .creapulse-report * {
            visibility: visible;
          }
          .creapulse-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: #111 !important;
          }
          .creapulse-report .dark\\:bg-gray-900,
          .creapulse-report .dark\\:bg-gray-800,
          .creapulse-report .dark\:bg-emerald-900\\/20,
          .creapulse-report .dark\:bg-violet-900\\/20,
          .creapulse-report .dark\:bg-amber-900\\/20 {
            background: #f9fafb !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>
    </motion.div>
  )
}
