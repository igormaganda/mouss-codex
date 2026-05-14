'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  Scale,
  Building2,
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  ArrowRight,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const STATUS_TYPES = [
  {
    key: 'AUTO_ENTREPRENEUR',
    label: 'Auto-entrepreneur',
    description: 'Régime simplifié, idéal pour tester un projet',
    pros: ['Formalités minimales', 'Comptabilité ultra simple', "Pas de capital minimum", 'Charges sociales proportionnelles au CA'],
    cons: ['Plafonds de CA', "Pas de déduction des charges réelles", 'Protection sociale limitée', 'Crédibilité moindre'],
    fiscalite: 'IR (micro-BIC/micro-BNC)',
    charges: '~21-22% du CA',
    plafond: '77 700€ (services) / 188 700€ (ventes)',
    color: 'emerald',
  },
  {
    key: 'SARL',
    label: 'SARL / EURL',
    description: 'Structure classique, protectrice pour le patrimoine',
    pros: ['Responsabilité limitée', 'Protection du patrimoine personnel', 'Souplesse de fonctionnement', 'Favorable pour les associés multiples'],
    cons: ['Formalités de création plus lourdes', 'Charges sociales élevées (TNS)', 'Rigidité statutaire', 'Comptabilité plus complexe'],
    fiscalite: 'IR ou IS au choix',
    charges: '~45-50% (TNS)',
    plafond: 'Aucun',
    color: 'violet',
  },
  {
    key: 'SAS',
    label: 'SAS / SASU',
    description: 'Structure moderne, attractive pour les investisseurs',
    pros: ["Status assimilé-salarié", 'RASS plus élevé', 'Flexible et évolutive', 'Très attractive pour les investisseurs'],
    cons: ['Charges sociales élevées', 'Formalités complexes', 'Rédaction des statuts coûteuse', 'Comptabilité encadrée'],
    fiscalite: 'IS par défaut',
    charges: '~60-65% (assimilé-salarié)',
    plafond: 'Aucun',
    color: 'sky',
  },
  {
    key: 'SCI',
    label: 'SCI',
    description: 'Pour la gestion de patrimoine immobilier',
    pros: ['Gestion simplifiée', 'Transmission de patrimoine', 'Fiscalité avantageuse', 'Souplesse de fonctionnement'],
    cons: ['Activité civile uniquement', "Pas d'activité commerciale", 'Formalités spécifiques', 'Gestion de la location'],
    fiscalite: 'IR (revenus fonciers)',
    charges: 'Variable selon l\'activité',
    plafond: 'Aucun',
    color: 'amber',
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string; light: string; darkBg: string; darkText: string; gradient: string }> = {
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    light: 'bg-emerald-50',
    darkBg: 'dark:bg-emerald-900/30',
    darkText: 'dark:text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
  },
  violet: {
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-200',
    light: 'bg-violet-50',
    darkBg: 'dark:bg-violet-900/30',
    darkText: 'dark:text-violet-400',
    gradient: 'from-violet-500 to-purple-500',
  },
  sky: {
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    border: 'border-sky-200',
    light: 'bg-sky-50',
    darkBg: 'dark:bg-sky-900/30',
    darkText: 'dark:text-sky-400',
    gradient: 'from-sky-500 to-blue-500',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    light: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/30',
    darkText: 'dark:text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
  },
}

export default function JuridiquePanel() {
  const userId = useAppStore((s) => s.userId)
  const [viewMode, setViewMode] = useState<'cards' | 'comparison'>('cards')
  const [expandedStatus, setExpandedStatus] = useState<string | null>('AUTO_ENTREPRENEUR')
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Load saved status on mount
  useEffect(() => {
    if (!userId) return
    const fetchSaved = async () => {
      try {
        const res = await fetch(`/api/juridique?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.statusType) setSelectedStatus(data.statusType)
        }
      } catch { /* use default */ }
    }
    fetchSaved()
  }, [userId])

  // Persist selected status
  const handleSelectStatus = (statusKey: string | null) => {
    const newStatus = selectedStatus === statusKey ? null : statusKey
    setSelectedStatus(newStatus)
    if (!userId || !newStatus) return
    fetch('/api/juridique', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, statusType: newStatus }),
    }).catch(() => { /* silent */ })
  }

  const toggleExpand = (key: string) => {
    setExpandedStatus((prev) => (prev === key ? null : key))
  }

  const handleRecommendation = async () => {
    setIsAnalyzing(true)
    try {
      const comparison = STATUS_TYPES.map((s) => {
        const c = colorMap[s.color]
        return `### ${s.label}\n- Fiscalité: ${s.fiscalite}\n- Charges: ${s.charges}\n- Plafond: ${s.plafond}\n- Avantages: ${s.pros.join(', ')}\n- Inconvénients: ${s.cons.join(', ')}`
      }).join('\n\n')

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `En tant qu'expert juridique en droit des affaires français, analyse ces 4 statuts juridiques et recommande le meilleur choix pour un porteur de projet qui débute son activité entrepreneuriale. Considère la simplicité, la protection sociale, la fiscalité et l'évolutivité.\n\n${comparison}\n\nDonne une recommandation structurée en français avec un tableau comparatif simplifié et un verdict clair.`,
            },
          ],
          context: { userName: 'Conseiller CréaScope', userRole: 'COUNSELOR' },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAiRecommendation(data.content)
      }
    } catch {
      // silent
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      {/* Header */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-violet-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Choix du statut juridique</h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Fiches détaillées
                </button>
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'comparison'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Tableau comparatif
                </button>
              </div>
              <Button
                onClick={handleRecommendation}
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
                className="ml-auto rounded-xl gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{isAnalyzing ? 'Analyse...' : 'Recommandation IA'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Recommendation */}
      <AnimatePresence>
        {aiRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">
                    Recommandation IA
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-emerald-50 border border-violet-200/50 dark:from-violet-900/20 dark:to-emerald-900/20 dark:border-violet-800/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {aiRecommendation}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card View */}
      {viewMode === 'cards' && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STATUS_TYPES.map((status) => {
            const colors = colorMap[status.color]
            const isExpanded = expandedStatus === status.key
            const isSelected = selectedStatus === status.key

            return (
              <motion.div key={status.key} variants={fadeIn}>
                <Card
                  className={`border-0 shadow-sm transition-all cursor-pointer ${
                    isSelected ? `ring-2 ${colors.border}` : ''
                  }`}
                  onClick={() => handleSelectStatus(status.key)}
                >
                  <CardContent className="p-0">
                    {/* Card Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{status.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{status.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Key Info */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Fiscalité</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{status.fiscalite}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Charges sociales</span>
                          <span className={`font-medium ${colors.text} ${colors.darkText}`}>{status.charges}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Plafond de CA</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{status.plafond}</span>
                        </div>
                      </div>

                      {/* Toggle expand */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(status.key)
                        }}
                        className="flex items-center gap-1 mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {isExpanded ? 'Masquer' : 'Détails'}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                            {/* Pros */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Avantages</span>
                              </div>
                              {status.pros.map((pro, i) => (
                                <div key={i} className="flex items-start gap-2 ml-5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{pro}</span>
                                </div>
                              ))}
                            </div>

                            {/* Cons */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Inconvénients</span>
                              </div>
                              {status.cons.map((con, i) => (
                                <div key={i} className="flex items-start gap-2 ml-5">
                                  <XCircle className="w-3 h-3 text-red-300 mt-0.5 shrink-0" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{con}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Comparison Table View */}
      {viewMode === 'comparison' && (
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 min-w-[140px]">
                      Critère
                    </th>
                    {STATUS_TYPES.map((s) => {
                      const colors = colorMap[s.color]
                      return (
                        <th key={s.key} className="text-left p-3 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${colors.gradient}`} />
                            <span className={`text-xs font-semibold ${colors.text} ${colors.darkText}`}>
                              {s.label}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Row: Fiscalité */}
                  <tr className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="p-3 text-xs font-medium text-gray-600 dark:text-gray-400">Fiscalité</td>
                    {STATUS_TYPES.map((s) => (
                      <td key={s.key} className="p-3 text-xs text-gray-700 dark:text-gray-300">{s.fiscalite}</td>
                    ))}
                  </tr>
                  {/* Row: Charges */}
                  <tr className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="p-3 text-xs font-medium text-gray-600 dark:text-gray-400">Charges sociales</td>
                    {STATUS_TYPES.map((s) => {
                      const colors = colorMap[s.color]
                      return (
                        <td key={s.key} className={`p-3 text-xs font-medium ${colors.text} ${colors.darkText}`}>
                          {s.charges}
                        </td>
                      )
                    })}
                  </tr>
                  {/* Row: Plafond */}
                  <tr className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="p-3 text-xs font-medium text-gray-600 dark:text-gray-400">Plafond de CA</td>
                    {STATUS_TYPES.map((s) => (
                      <td key={s.key} className="p-3 text-xs text-gray-700 dark:text-gray-300">{s.plafond}</td>
                    ))}
                  </tr>
                  {/* Row: Nb Pros */}
                  <tr className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="p-3 text-xs font-medium text-gray-600 dark:text-gray-400">Nb avantages</td>
                    {STATUS_TYPES.map((s) => (
                      <td key={s.key} className="p-3">
                        <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          {s.pros.length}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  {/* Row: Nb Cons */}
                  <tr className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="p-3 text-xs font-medium text-gray-600 dark:text-gray-400">Nb inconvénients</td>
                    {STATUS_TYPES.map((s) => (
                      <td key={s.key} className="p-3">
                        <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="w-2.5 h-2.5 mr-0.5" />
                          {s.cons.length}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  {/* Row: Protection sociale */}
                  <tr className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="p-3 text-xs font-medium text-gray-600 dark:text-gray-400">Protection sociale</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">Limitée</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">Moyenne (TNS)</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">Élevée (assimilé-salarié)</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200">N/A</Badge>
                    </td>
                  </tr>
                  {/* Row: Complexité */}
                  <tr>
                    <td className="p-3 text-xs font-medium text-gray-600 dark:text-gray-400">Complexité création</td>
                    <td className="p-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((l) => (
                          <div key={l} className={`w-4 h-1.5 rounded-full ${l <= 1 ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((l) => (
                          <div key={l} className={`w-4 h-1.5 rounded-full ${l <= 2 ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((l) => (
                          <div key={l} className={`w-4 h-1.5 rounded-full ${l <= 3 ? 'bg-red-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((l) => (
                          <div key={l} className={`w-4 h-1.5 rounded-full ${l <= 2 ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Obligations Checklist */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-sm text-gray-900 dark:text-gray-100">
                Obligations clés — quel que soit le statut
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Immatriculation au RCS ou au RM',
                "Déclaration d'activité",
                'Ouverture d\'un compte bancaire dédié',
                'Souscription d\'une assurance professionnelle',
                'Tenue d\'une comptabilité',
                'Déclaration fiscale annuelle',
                'Respect des plafonds de CA (le cas échéant)',
                'Respect des obligations sociales',
              ].map((obligation, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{obligation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
