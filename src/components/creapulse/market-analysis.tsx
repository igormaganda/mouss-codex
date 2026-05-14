'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Search,
  TrendingUp,
  TrendingDown,
  Globe,
  BarChart3,
  Users,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Download,
  Save,
  RefreshCw,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

// ====================== CONSTANTS ======================
const SUGGESTED_SECTORS = [
  'Restauration / Food', 'E-commerce', 'Tech / SaaS', 'Conseil / Consulting',
  'BTP / Construction', 'Santé / Bien-être', 'Éducation / Formation',
  'Tourisme / Hôtellerie', 'Artisanat', 'Commerce de détail',
  'Agriculture / Agroalimentaire', 'Immobilier', 'Transport / Logistique',
  'Énergie renouvelable', 'Mode / Textile', 'Coaching sportif',
]

const FRENCH_REGIONS = [
  'Auvergne-Rhône-Alpes', 'Bretagne', 'Bourgogne-Franche-Comté', 'Corse',
  'Centre-Val de Loire', 'Grand Est', 'Hauts-de-France', 'Île-de-France',
  'Normandie', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire',
  "Provence-Alpes-Côte d'Azur", 'DOM-TOM',
]

const KNOWLEDGE_CATEGORIES = ['Tous', 'Études de marché', 'Réglementation', 'Bonnes pratiques', 'Actualités']

const DEMO_KNOWLEDGE_ENTRIES = [
  { id: '1', title: 'Le marché de la restauration en France en 2025', source: 'INSEE', tags: ['restauration', 'food', 'france'], category: 'Études de marché', date: '2025-01-15', url: '#' },
  { id: '2', title: 'Réglementation des auto-entrepreneurs : guide complet', source: 'Service-public.fr', tags: ['auto-entrepreneur', 'réglementation'], category: 'Réglementation', date: '2025-02-01', url: '#' },
  { id: '3', title: '10 bonnes pratiques pour lancer son e-commerce', source: 'Bpifrance', tags: ['e-commerce', 'digital', 'création'], category: 'Bonnes pratiques', date: '2025-01-20', url: '#' },
  { id: '4', title: 'Aides à la création d\'entreprise en 2025', source: 'France Travail', tags: ['aides', 'subventions', 'création'], category: 'Actualités', date: '2025-03-01', url: '#' },
  { id: '5', title: 'Étude sectorielle : Tech & SaaS en France', source: 'Maddyness', tags: ['tech', 'saas', 'innovation'], category: 'Études de marché', date: '2024-12-10', url: '#' },
  { id: '6', title: 'Normes sanitaires pour le secteur alimentaire', source: 'DGCCRF', tags: ['alimentaire', 'normes', 'sécurité'], category: 'Réglementation', date: '2025-02-15', url: '#' },
]

// ====================== ANIMATION VARIANTS ======================
const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// ====================== TYPES ======================
interface AnalysisData {
  marketOverview?: {
    marketSize: string
    growthRate: string
    trend: 'up' | 'down' | 'stable'
    description: string
  }
  targetCustomers?: Array<{
    name: string
    description: string
    segment: string
  }>
  competitors?: Array<{
    name: string
    strengths: string
    weaknesses: string
    marketShare: string
  }>
  trends?: Array<{
    name: string
    impact: 'high' | 'medium' | 'low'
    timeframe: string
    description: string
  }>
  swot?: {
    opportunities: string[]
    threats: string[]
    strengths: string[]
    weaknesses: string[]
  }
  keyIndicators?: Array<{
    label: string
    value: string
    source: string
  }>
  recommendations?: Array<{
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    action: string
  }>
  confidenceScore?: number
  synthesis?: string
}

// ====================== CONFIDENCE DONUT ======================
function ConfidenceDonut({ score }: { score: number }) {
  const size = 120
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', label: 'Fiable' }
    if (s >= 60) return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', label: 'Modéré' }
    return { stroke: '#ef4444', text: 'text-red-600 dark:text-red-400', label: 'Faible' }
  }
  const colorInfo = getColor(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100 dark:text-gray-800"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorInfo.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${colorInfo.text}`}>{score}%</span>
          <span className="text-[10px] text-gray-400">Confiance</span>
        </div>
      </div>
      <Badge variant="secondary" className={`${colorInfo.text} text-xs font-medium`}>
        {colorInfo.label}
      </Badge>
    </div>
  )
}

// ====================== LOADING SKELETON ======================
function AnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-60 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

// ====================== MAIN COMPONENT ======================
export default function MarketAnalysis() {
  // Search form state
  const [sector, setSector] = useState('')
  const [region, setRegion] = useState('')
  const [description, setDescription] = useState('')
  const [showSectorSuggestions, setShowSectorSuggestions] = useState(false)

  // Analysis state
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Knowledge base state
  const [kbOpen, setKbOpen] = useState(false)
  const [kbSearch, setKbSearch] = useState('')
  const [kbCategory, setKbCategory] = useState('Tous')

  // Filtered sectors for autocomplete
  const filteredSectors = useMemo(() => {
    if (!sector) return SUGGESTED_SECTORS.slice(0, 6)
    return SUGGESTED_SECTORS.filter((s) =>
      s.toLowerCase().includes(sector.toLowerCase())
    )
  }, [sector])

  // Filtered knowledge entries
  const filteredKnowledge = useMemo(() => {
    return DEMO_KNOWLEDGE_ENTRIES.filter((entry) => {
      const matchesSearch =
        !kbSearch ||
        entry.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
        entry.tags.some((t) => t.toLowerCase().includes(kbSearch.toLowerCase()))
      const matchesCategory = kbCategory === 'Tous' || entry.category === kbCategory
      return matchesSearch && matchesCategory
    })
  }, [kbSearch, kbCategory])

  // Launch analysis
  const launchAnalysis = useCallback(async () => {
    if (!sector.trim()) return
    setIsLoading(true)
    setError(null)
    setAnalysis(null)
    setIsSaved(false)

    try {
      const res = await fetch('/api/market-analysis/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: sector.trim(),
          region: region || undefined,
          description: description || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'analyse")
        return
      }

      setAnalysis(data.analysis)
    } catch {
      setError('Erreur de connexion. Veuillez vérifier votre réseau.')
    } finally {
      setIsLoading(false)
    }
  }, [sector, region, description])

  // Save analysis
  const saveAnalysis = useCallback(async () => {
    if (!analysis) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector,
          region: region || null,
          description: description || null,
          analysisData: analysis,
          confidenceScore: analysis.confidenceScore,
        }),
      })

      if (res.ok) {
        setIsSaved(true)
      }
    } catch {
      /* silent */
    } finally {
      setIsSaving(false)
    }
  }, [analysis, sector, region, description])

  // Export analysis as JSON
  const exportAnalysis = useCallback(() => {
    if (!analysis) return
    const blob = new Blob([JSON.stringify({ sector, region, description, ...analysis }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analyse-marche-${sector.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [analysis, sector, region, description])

  // Refine analysis
  const refineAnalysis = useCallback(() => {
    launchAnalysis()
  }, [launchAnalysis])

  // Trend icon helper
  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-emerald-500" />
    if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-amber-500" />
  }

  // Impact badge color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    }
  }

  // Priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* ==================== SEARCH FORM ==================== */}
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Analyse de marché</CardTitle>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Lancez une analyse IA pour explorer votre secteur, identifier vos concurrents et découvrir les opportunités.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sector input with autocomplete */}
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                Secteur d&apos;activité
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={sector}
                  onChange={(e) => {
                    setSector(e.target.value)
                    setShowSectorSuggestions(true)
                  }}
                  onFocus={() => setShowSectorSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSectorSuggestions(false), 200)}
                  placeholder="Ex: Restauration / Food, E-commerce..."
                  className="pl-10 h-10 rounded-xl border-gray-200"
                />
              </div>
              <AnimatePresence>
                {showSectorSuggestions && filteredSectors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                  >
                    {filteredSectors.map((s) => (
                      <button
                        key={s}
                        onMouseDown={() => { setSector(s); setShowSectorSuggestions(false) }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Region selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                Région
              </label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-full rounded-xl border-gray-200 h-10">
                  <SelectValue placeholder="Sélectionnez une région..." />
                </SelectTrigger>
                <SelectContent>
                  {FRENCH_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description textarea */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                Description du projet <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez brièvement votre projet ou votre idée d'entreprise..."
                className="rounded-xl border-gray-200 resize-none min-h-[80px]"
              />
            </div>

            {/* Launch button */}
            <Button
              onClick={launchAnalysis}
              disabled={!sector.trim() || isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Lancer l&apos;analyse
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ==================== ERROR STATE ==================== */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
                <Button variant="outline" size="sm" onClick={launchAnalysis} className="shrink-0 rounded-lg border-red-200 text-red-700 hover:bg-red-100">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== LOADING STATE ==================== */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnalysisSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== RESULTS ==================== */}
      <AnimatePresence>
        {analysis && !isLoading && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            {/* Action buttons */}
            <motion.div variants={fadeIn} className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportAnalysis} className="rounded-lg">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exporter l&apos;analyse
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveAnalysis}
                disabled={isSaving || isSaved}
                className="rounded-lg"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : isSaved ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
              </Button>
              <Button variant="outline" size="sm" onClick={refineAnalysis} className="rounded-lg">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Relancer avec plus de détails
              </Button>
            </motion.div>

            {/* ---------- Market Overview + Confidence ---------- */}
            <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Market Size */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3 opacity-80">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Taille du marché</span>
                  </div>
                  <p className="text-2xl font-bold">{analysis.marketOverview?.marketSize || 'N/A'}</p>
                  <p className="text-xs opacity-70 mt-1">{analysis.marketOverview?.description || ''}</p>
                </CardContent>
              </Card>

              {/* Growth Rate */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3 opacity-80">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Croissance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{analysis.marketOverview?.growthRate || 'N/A'}</p>
                    <TrendIcon trend={analysis.marketOverview?.trend || 'stable'} />
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                    className="mt-3 h-1.5 bg-white/20 rounded-full"
                  >
                    <div
                      className={`h-full rounded-full ${
                        analysis.marketOverview?.trend === 'up'
                          ? 'bg-emerald-300'
                          : analysis.marketOverview?.trend === 'down'
                            ? 'bg-red-300'
                            : 'bg-amber-300'
                      }`}
                      style={{ width: `${Math.min(Math.abs(parseFloat(analysis.marketOverview?.growthRate || '0')) * 3, 100)}%` }}
                    />
                  </motion.div>
                </CardContent>
              </Card>

              {/* Confidence Score */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 flex flex-col items-center justify-center">
                  <ConfidenceDonut score={analysis.confidenceScore || 50} />
                </CardContent>
              </Card>
            </motion.div>

            {/* ---------- Target Customers ---------- */}
            {analysis.targetCustomers && analysis.targetCustomers.length > 0 && (
              <motion.div variants={fadeIn}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-violet-500" />
                      <CardTitle className="text-base">Clients cibles</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.targetCustomers.map((customer, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800 transition-all cursor-default group bg-white dark:bg-gray-950"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-3.5 h-3.5 text-violet-500" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{customer.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{customer.description}</p>
                          <Badge variant="secondary" className="text-[10px] bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                            {customer.segment}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------- Competitor Table ---------- */}
            {analysis.competitors && analysis.competitors.length > 0 && (
              <motion.div variants={fadeIn}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      <CardTitle className="text-base">Analyse concurrentielle</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                            <TableHead className="text-xs font-semibold">Concurrent</TableHead>
                            <TableHead className="text-xs font-semibold">Forces</TableHead>
                            <TableHead className="text-xs font-semibold">Faiblesses</TableHead>
                            <TableHead className="text-xs font-semibold">Part de marché</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysis.competitors.map((comp, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium text-sm">{comp.name}</TableCell>
                              <TableCell>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">{comp.strengths}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-red-600 dark:text-red-400">{comp.weaknesses}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {comp.marketShare}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------- Trends ---------- */}
            {analysis.trends && analysis.trends.length > 0 && (
              <motion.div variants={fadeIn}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <CardTitle className="text-base">Tendances du marché</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.trends.map((trend, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all"
                        >
                          <div className="mt-0.5">
                            {trend.impact === 'high' ? (
                              <ArrowUpRight className="w-4 h-4 text-red-500" />
                            ) : trend.impact === 'medium' ? (
                              <Minus className="w-4 h-4 text-amber-500" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{trend.name}</span>
                              <Badge className={`text-[10px] ${getImpactColor(trend.impact)}`}>
                                {trend.impact === 'high' ? 'Fort impact' : trend.impact === 'medium' ? 'Impact moyen' : 'Faible impact'}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] text-gray-500">
                                {trend.timeframe}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{trend.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------- SWOT Grid ---------- */}
            {analysis.swot && (
              <motion.div variants={fadeIn}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-violet-500" />
                      <CardTitle className="text-base">Matrice SWOT</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Forces</span>
                        </div>
                        <ul className="space-y-1.5">
                          {(analysis.swot.strengths || []).map((item, i) => (
                            <li key={i} className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                          {(!analysis.swot.strengths || analysis.swot.strengths.length === 0) && (
                            <li className="text-xs text-gray-400 italic">Aucune force identifiée</li>
                          )}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Faiblesses</span>
                        </div>
                        <ul className="space-y-1.5">
                          {(analysis.swot.weaknesses || []).map((item, i) => (
                            <li key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                          {(!analysis.swot.weaknesses || analysis.swot.weaknesses.length === 0) && (
                            <li className="text-xs text-gray-400 italic">Aucune faiblesse identifiée</li>
                          )}
                        </ul>
                      </div>

                      {/* Opportunities */}
                      <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Opportunités</span>
                        </div>
                        <ul className="space-y-1.5">
                          {(analysis.swot.opportunities || []).map((item, i) => (
                            <li key={i} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                          {(!analysis.swot.opportunities || analysis.swot.opportunities.length === 0) && (
                            <li className="text-xs text-gray-400 italic">Aucune opportunité identifiée</li>
                          )}
                        </ul>
                      </div>

                      {/* Threats */}
                      <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          </div>
                          <span className="text-sm font-semibold text-red-700 dark:text-red-400">Menaces</span>
                        </div>
                        <ul className="space-y-1.5">
                          {(analysis.swot.threats || []).map((item, i) => (
                            <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                          {(!analysis.swot.threats || analysis.swot.threats.length === 0) && (
                            <li className="text-xs text-gray-400 italic">Aucune menace identifiée</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------- Key Indicators ---------- */}
            {analysis.keyIndicators && analysis.keyIndicators.length > 0 && (
              <motion.div variants={fadeIn}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      <CardTitle className="text-base">Indicateurs clés</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {analysis.keyIndicators.map((indicator, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06 }}
                          className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{indicator.label}</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{indicator.value}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Source : {indicator.source}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------- AI Recommendations ---------- */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <motion.div variants={fadeIn}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-violet-500" />
                      <CardTitle className="text-base">Recommandations IA</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.recommendations.map((rec, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className={`p-4 rounded-xl border ${getPriorityColor(rec.priority)} transition-all hover:shadow-sm`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                              rec.priority === 'high'
                                ? 'bg-red-500 text-white'
                                : rec.priority === 'medium'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-emerald-500 text-white'
                            }`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{rec.title}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {rec.priority === 'high' ? 'Priorité haute' : rec.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{rec.description}</p>
                              {rec.action && (
                                <p className="text-xs text-violet-600 dark:text-violet-400 mt-1.5 font-medium">
                                  → {rec.action}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------- Synthesis ---------- */}
            {analysis.synthesis && (
              <motion.div variants={fadeIn}>
                <Card className="border-0 shadow-sm bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-900/20 dark:to-emerald-900/20 border-violet-100 dark:border-violet-800">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">Synthèse</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.synthesis}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== KNOWLEDGE BASE ==================== */}
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <Collapsible open={kbOpen} onOpenChange={setKbOpen}>
          <Card className="border-0 shadow-sm">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    <CardTitle className="text-base">Base de connaissances</CardTitle>
                    <Badge variant="secondary" className="text-xs">{DEMO_KNOWLEDGE_ENTRIES.length} entrées</Badge>
                  </div>
                  <motion.div
                    animate={{ rotate: kbOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={kbSearch}
                      onChange={(e) => setKbSearch(e.target.value)}
                      placeholder="Rechercher dans la base de connaissances..."
                      className="pl-10 h-9 rounded-xl border-gray-200 text-sm"
                    />
                  </div>
                </div>

                {/* Category tabs */}
                <Tabs value={kbCategory} onValueChange={setKbCategory}>
                  <TabsList className="bg-gray-100 p-0.5 rounded-lg h-8">
                    {KNOWLEDGE_CATEGORIES.map((cat) => (
                      <TabsTrigger
                        key={cat}
                        value={cat}
                        className="rounded-md text-xs px-3 h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        {cat}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {/* Knowledge entries list */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredKnowledge.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Aucune entrée trouvée
                    </div>
                  ) : (
                    filteredKnowledge.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {entry.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-400">{entry.source}</span>
                              <span className="text-[10px] text-gray-300">·</span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(entry.date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] bg-gray-50 dark:bg-gray-900 text-gray-500">
                              {tag}
                            </Badge>
                          ))}
                          <Badge variant="secondary" className="text-[10px] bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                            {entry.category}
                          </Badge>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>
    </div>
  )
}
