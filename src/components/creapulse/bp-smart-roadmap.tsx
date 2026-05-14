'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Target,
  BarChart3,
  CheckCircle2,
  Star,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Map,
  Filter,
  Check,
  Circle,
  Sparkles,
  Building2,
  FileText,
  TrendingUp,
  AlertTriangle,
  Milestone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Milestone {
  id: string
  text: string
  completed: boolean
}

interface SMARTCriteria {
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timeBound: string
}

type Priority = 'high' | 'medium' | 'low'

interface RoadmapObjective {
  id: string
  title: string
  description: string
  monthStart: number
  monthEnd: number
  priority: Priority
  smartCriteria: SMARTCriteria
  milestones: Milestone[]
}

interface RoadmapData {
  projectName: string
  sector: string
  description: string
  currentStage: string
  overallProgress: number
  objectives: RoadmapObjective[]
}

interface FormData {
  projectName: string
  sector: string
  description: string
  currentStage: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MONTH_LABELS = [
  'Mois 1',
  'Mois 2',
  'Mois 3',
  'Mois 4',
  'Mois 5',
  'Mois 6',
]

const SMART_CONFIG = [
  { key: 'specific' as const, label: 'Spécifique', color: '#059669', icon: Target },
  { key: 'measurable' as const, label: 'Mesurable', color: '#0284c7', icon: BarChart3 },
  { key: 'achievable' as const, label: 'Atteignable', color: '#8b5cf6', icon: CheckCircle2 },
  { key: 'relevant' as const, label: 'Pertinent', color: '#ea580c', icon: Star },
  { key: 'timeBound' as const, label: 'Temporel', color: '#dc2626', icon: Clock },
]

const PRIORITY_BADGE: Record<Priority, { label: string; className: string }> = {
  high: { label: 'Haute', className: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Moyenne', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Basse', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

const PRIORITY_BORDER: Record<Priority, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-emerald-500',
}

const PRIORITY_FILTERS: { value: Priority | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
]

const SECTOR_OPTIONS = [
  'Technologie',
  'Commerce / Retail',
  'Services B2B',
  'Santé',
  'Éducation',
  'Immobilier',
  'Restauration / Hôtellerie',
  'Industrie',
  'Finance / Fintech',
  'Autre',
]

const STAGE_OPTIONS = [
  'Idée / Conception',
  'Validation du marché',
  'Prototype / MVP',
  'Lancement initial',
  'Croissance',
  'Maturité / Expansion',
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getObjProgress(obj: RoadmapObjective): number {
  if (!obj.milestones.length) return 0
  return Math.round((obj.milestones.filter((m) => m.completed).length / obj.milestones.length) * 100)
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SmartRoadmapGenerator() {
  /* ----- state ----- */
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    sector: '',
    description: '',
    currentStage: '',
  })

  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(new Set())
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [exporting, setExporting] = useState(false)

  /* ----- derived ----- */
  const filteredObjectives = useMemo(() => {
    if (!roadmap) return []
    if (priorityFilter === 'all') return roadmap.objectives
    return roadmap.objectives.filter((o) => o.priority === priorityFilter)
  }, [roadmap, priorityFilter])

  const overallProgress = useMemo(() => {
    if (!roadmap) return 0
    const allMilestones = roadmap.objectives.flatMap((o) => o.milestones)
    if (!allMilestones.length) return 0
    return Math.round((allMilestones.filter((m) => completedMilestones.has(m.id)).length / allMilestones.length) * 100)
  }, [roadmap, completedMilestones])

  /* ----- handlers ----- */
  const handleInputChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    },
    [],
  )

  const handleSelectChange = useCallback(
    (field: keyof FormData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleMilestone = useCallback((milestoneId: string) => {
    setCompletedMilestones((prev) => {
      const next = new Set(prev)
      if (next.has(milestoneId)) next.delete(milestoneId)
      else next.add(milestoneId)
      return next
    })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const token = typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null
    if (!token) {
      setError('Authentification requise. Veuillez vous connecter.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/business-plan/smart-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || `Erreur serveur (${res.status})`)
      }

      const data: RoadmapData = await res.json()
      setRoadmap(data)
      setExpandedIds(new Set())
      setCompletedMilestones(new Set())
      setPriorityFilter('all')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }, [formData])

  const handleExport = useCallback(() => {
    if (!roadmap) return
    setExporting(true)

    let text = ''
    text += '╔══════════════════════════════════════════════════════════╗\n'
    text += '║           FEUILLE DE ROUTE SMART — CréaScope            ║\n'
    text += '╚══════════════════════════════════════════════════════════╝\n\n'
    text += `Projet  : ${roadmap.projectName}\n`
    text += `Secteur : ${roadmap.sector}\n`
    text += `Description : ${roadmap.description}\n`
    text += `Étape actuelle : ${roadmap.currentStage}\n`
    text += `Progression globale : ${overallProgress}%\n\n`
    text += '────────────────────────────────────────────────────────────\n\n'

    roadmap.objectives.forEach((obj, idx) => {
      const p = PRIORITY_BADGE[obj.priority].label
      text += `${idx + 1}. ${obj.title}\n`
      text += `   Priorité : ${p}  |  Période : Mois ${obj.monthStart} → Mois ${obj.monthEnd}\n`
      text += `   ${obj.description}\n`

      const objProg = getObjProgress({ ...obj, milestones: obj.milestones.map((m) => ({ ...m, completed: completedMilestones.has(m.id) })) })
      text += `   Progression : ${objProg}%\n\n`

      text += '   ── Critères SMART ──\n'
      SMART_CONFIG.forEach((c) => {
        text += `   [${c.label}] ${obj.smartCriteria[c.key]}\n`
      })
      text += '\n'

      text += '   ── Jalons ──\n'
      obj.milestones.forEach((m) => {
        const done = completedMilestones.has(m.id)
        text += `   ${done ? '✅' : '⬜'} ${m.text}\n`
      })
      text += '\n────────────────────────────────────────────────────────────\n\n'
    })

    text += `Généré par CréaScope — ${new Date().toLocaleDateString('fr-FR')}\n`

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feuille-de-route-${roadmap.projectName.replace(/\s+/g, '-').toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExporting(false)
  }, [roadmap, overallProgress, completedMilestones])

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* ─── Form ─── */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Map className="h-5 w-5 text-emerald-600" />
            Générateur de Feuille de Route SMART
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Décrivez votre projet pour obtenir une feuille de route stratégique sur 6 mois avec des objectifs SMART.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Project name */}
              <div className="space-y-2">
                <Label htmlFor="projectName">Nom du projet</Label>
                <Input
                  id="projectName"
                  placeholder="Ex : EcoDelivery"
                  value={formData.projectName}
                  onChange={handleInputChange('projectName')}
                  required
                />
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <Label htmlFor="sector">Secteur d&apos;activité</Label>
                <Select value={formData.sector} onValueChange={handleSelectChange('sector')} required>
                  <SelectTrigger id="sector">
                    <SelectValue placeholder="Sélectionnez un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTOR_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current stage */}
            <div className="space-y-2">
              <Label htmlFor="currentStage">Étape actuelle du projet</Label>
              <Select value={formData.currentStage} onValueChange={handleSelectChange('currentStage')} required>
                <SelectTrigger id="currentStage">
                  <SelectValue placeholder="Sélectionnez l'étape" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description du projet</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre projet, votre vision, vos ambitions..."
                value={formData.description}
                onChange={handleInputChange('description')}
                rows={4}
                required
              />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Génération en cours...' : 'Générer la Feuille de Route'}
              </Button>
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── Roadmap ─── */}
      {roadmap && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* ──── Header ──── */}
          <Card className="shadow-md border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{roadmap.sector}</span>
                    <span className="mx-1">•</span>
                    <span>{roadmap.currentStage}</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">{roadmap.projectName}</h2>
                  <p className="text-sm text-muted-foreground max-w-xl">{roadmap.description}</p>
                </div>

                <div className="flex flex-col items-center gap-1 min-w-[100px]">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Progression</span>
                  <span className="text-3xl font-bold text-emerald-600">{overallProgress}%</span>
                </div>
              </div>

              <div className="mt-4">
                <Progress value={overallProgress} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-emerald-600" />
              </div>
            </CardContent>
          </Card>

          {/* ──── Controls bar ──── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Priority filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground mr-1">Priorité :</span>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setPriorityFilter(f.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      priorityFilter === f.value
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exporter en texte
            </Button>
          </div>

          {/* ──── Timeline bar ──── */}
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="pt-5 pb-5 px-4 sm:px-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Chronologie — 6 mois
                </h3>
              </div>

              {/* Desktop horizontal timeline */}
              <div className="hidden md:block">
                <div className="relative flex items-center justify-between px-1">
                  {/* Connecting line */}
                  <div className="absolute top-3 left-[24px] right-[24px] h-0.5 bg-emerald-200 z-0" />

                  {MONTH_LABELS.map((label, i) => {
                    const monthNum = i + 1
                    const objCount = roadmap.objectives.filter(
                      (o) => o.monthStart <= monthNum && o.monthEnd >= monthNum,
                    ).length

                    return (
                      <div key={label} className="relative z-10 flex flex-col items-center">
                        {/* Dot */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            objCount > 0
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white border-2 border-emerald-300 text-emerald-600'
                          }`}
                        >
                          {objCount > 0 ? objCount : ''}
                        </div>
                        {/* Label */}
                        <span className="mt-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mobile vertical timeline */}
              <div className="md:hidden space-y-3">
                {MONTH_LABELS.map((label, i) => {
                  const monthNum = i + 1
                  const objs = roadmap.objectives.filter(
                    (o) => o.monthStart <= monthNum && o.monthEnd >= monthNum,
                  )

                  return (
                    <div key={label} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          objs.length > 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border-2 border-emerald-300 text-emerald-600'
                        }`}
                      >
                        {objs.length > 0 ? objs.length : monthNum}
                      </div>
                      <div className="pt-1">
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ──── Objective cards ──── */}
          <div className="space-y-4">
            {filteredObjectives.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Aucun objectif avec cette priorité.</p>
              </div>
            ) : (
              filteredObjectives.map((obj) => {
                const isExpanded = expandedIds.has(obj.id)
                const objProgress = getObjProgress({
                  ...obj,
                  milestones: obj.milestones.map((m) => ({ ...m, completed: completedMilestones.has(m.id) })),
                })
                const completedCount = obj.milestones.filter((m) => completedMilestones.has(m.id)).length
                const totalCount = obj.milestones.length

                return (
                  <Card
                    key={obj.id}
                    className={`shadow-sm border-l-4 ${PRIORITY_BORDER[obj.priority]} overflow-hidden transition-all duration-200 ${
                      isExpanded ? 'ring-1 ring-emerald-200' : ''
                    }`}
                  >
                    {/* Card header */}
                    <button
                      type="button"
                      className="w-full text-left px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpand(obj.id)}
                    >
                      {/* Left: period indicator */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Milestone className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                          M{obj.monthStart} → M{obj.monthEnd}
                        </span>
                      </div>

                      {/* Center: title + description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm sm:text-base">{obj.title}</h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${PRIORITY_BADGE[obj.priority].className}`}
                          >
                            {PRIORITY_BADGE[obj.priority].label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{obj.description}</p>
                      </div>

                      {/* Right: progress + chevron */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {completedCount}/{totalCount} jalons
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
                                style={{ width: `${objProgress}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-emerald-600">{objProgress}%</span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-5 border-t border-border/50 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* SMART criteria grid */}
                        <div>
                          <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Critères SMART
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {SMART_CONFIG.map((c) => {
                              const Icon = c.icon
                              return (
                                <div
                                  key={c.key}
                                  className="rounded-lg border border-border/60 bg-white shadow-sm overflow-hidden"
                                  style={{ borderLeftWidth: '4px', borderLeftColor: c.color }}
                                >
                                  <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                                    <Icon className="h-4 w-4 shrink-0" style={{ color: c.color }} />
                                    <span className="text-xs font-semibold" style={{ color: c.color }}>
                                      {c.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground px-3 pb-2.5 leading-relaxed">
                                    {obj.smartCriteria[c.key]}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Milestones */}
                        <div>
                          <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Jalons
                          </h5>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                            {obj.milestones.map((m) => {
                              const isDone = completedMilestones.has(m.id)
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => toggleMilestone(m.id)}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                    isDone ? 'bg-emerald-50/70' : 'bg-muted/40 hover:bg-muted/70'
                                  }`}
                                >
                                  {isDone ? (
                                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-400 shrink-0" />
                                  )}
                                  <span className={isDone ? 'text-emerald-700 line-through' : 'text-foreground'}>
                                    {m.text}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })
            )}
          </div>

          {/* ──── Summary footer ──── */}
          <Card className="shadow-sm bg-muted/30">
            <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-emerald-600" />
                  {filteredObjectives.length} objectif{filteredObjectives.length > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {overallProgress}% complété
                </span>
              </div>
              <span className="text-xs">
                Feuille de route générée par CréaScope — {new Date().toLocaleDateString('fr-FR')}
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
