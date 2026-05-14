'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Target,
  BookOpen,
  Users,
  GraduationCap,
  Zap,
  Calendar,
  ChevronRight,
  Play,
  SkipForward,
  Pencil,
  ExternalLink,
  FileText,
  Video,
  Link2,
  Flame,
  Award,
  TrendingUp,
  Loader2,
  ArrowRight,
  Quote,
} from 'lucide-react'

// ==================== TYPES ====================
type StepType = 'action' | 'content' | 'meeting' | 'training'
type StepStatus = 'completed' | 'current' | 'upcoming' | 'skipped'

interface PathStep {
  id: string
  title: string
  description: string
  type: StepType
  status: StepStatus
  order: number
  dueDate: string
  resources: Array<{ title: string; type: 'link' | 'document' | 'video'; url: string }>
}

interface PersonalizedPath {
  id: string
  userId: string
  steps: PathStep[]
  progress: number
  badges: Array<{ id: string; name: string; icon: string; earned: boolean; earnedDate?: string }>
  streakDays: number
  nextAction: string
  createdAt: string
}

// ==================== CONSTANTS ====================
const STEP_TYPE_CONFIG: Record<StepType, { icon: typeof Target; color: string; bgColor: string; label: string }> = {
  action: { icon: Target, color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'Action' },
  content: { icon: BookOpen, color: 'text-sky-600', bgColor: 'bg-sky-50', label: 'Contenu' },
  meeting: { icon: Users, color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Rencontre' },
  training: { icon: GraduationCap, color: 'text-violet-600', bgColor: 'bg-violet-50', label: 'Formation' },
}

const STATUS_CONFIG: Record<StepStatus, { color: string; label: string }> = {
  completed: { color: 'text-emerald-600', label: 'Terminé' },
  current: { color: 'text-indigo-600', label: 'En cours' },
  upcoming: { color: 'text-gray-400', label: 'À venir' },
  skipped: { color: 'text-gray-400', label: 'Ignoré' },
}

const RESOURCE_ICON: Record<string, typeof Link2> = {
  link: Link2,
  document: FileText,
  video: Video,
}

const MOTIVATIONAL_QUOTES = [
  { text: 'Le succès, c\'est d\'aller d\'échec en échec sans perdre son enthousiasme.', author: 'Winston Churchill' },
  { text: 'Chaque grand accomplishment a d\'abord été considéré comme impossible.', author: 'Proverbe' },
  { text: 'La seule façon de faire du bon travail est d\'aimer ce que vous faites.', author: 'Steve Jobs' },
  { text: 'L\'avenir appartient à ceux qui croient à la beauté de leurs rêves.', author: 'Eleanor Roosevelt' },
  { text: 'N\'attendez pas. Le temps ne sera jamais juste.', author: 'Napoleon Hill' },
  { text: 'Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.', author: 'Proverbe chinois' },
  { text: 'Tout ce que vous pouvez imaginer est réel.', author: 'Pablo Picasso' },
  { text: 'Ce n\'est pas parce que les choses sont difficiles que nous n\'osons pas, c\'est parce que nous n\'osons pas qu\'elles sont difficiles.', author: 'Sénèque' },
]

// ==================== HELPERS ====================
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function fetchJson<T>(url: string, fallback: T | null, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...opts, headers: { ...authHeaders(), ...opts?.headers } })
    if (!res.ok) return fallback
    return await res.json()
  } catch {
    return fallback
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getDaysRemaining(dateStr: string): number {
  const now = new Date()
  const due = new Date(dateStr)
  return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / 86400000))
}

// ==================== ANIMATIONS ====================
const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}

// ==================== CIRCULAR PROGRESS ====================
function CircularProgress({ value, size = 140 }: { value: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const center = size / 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-bold text-gray-900"
        >
          {Math.round(value)}%
        </motion.span>
        <span className="text-xs text-gray-500 mt-0.5">Progression</span>
      </div>
    </div>
  )
}

// ==================== MOTIVATIONAL QUOTE ====================
function MotivationalQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const quote = MOTIVATIONAL_QUOTES[quoteIndex]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={quoteIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100/50"
      >
        <Quote className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
          <p className="text-xs text-indigo-500 font-medium mt-1">— {quote.author}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ==================== STEP CARD ====================
function StepCard({
  step,
  isLast,
  onComplete,
  onSkip,
  onEditDate,
}: {
  step: PathStep
  isLast: boolean
  onComplete: (id: string) => void
  onSkip: (id: string) => void
  onEditDate: (id: string, date: string) => void
}) {
  const [expanded, setExpanded] = useState(step.status === 'current')
  const [editingDate, setEditingDate] = useState(false)
  const [newDate, setNewDate] = useState(step.dueDate)

  const config = STEP_TYPE_CONFIG[step.type]
  const Icon = config.icon
  const daysLeft = getDaysRemaining(step.dueDate)

  const handleSaveDate = () => {
    onEditDate(step.id, newDate)
    setEditingDate(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-4"
    >
      {/* Timeline line and node */}
      <div className="flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            step.status === 'completed'
              ? 'bg-emerald-500 shadow-lg shadow-emerald-200'
              : step.status === 'current'
                ? 'bg-indigo-500 shadow-lg shadow-indigo-200'
                : step.status === 'skipped'
                  ? 'bg-gray-300'
                  : 'bg-gray-200'
          }`}
        >
          {step.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : step.status === 'current' ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-3 h-3 bg-white rounded-full"
            />
          ) : step.status === 'skipped' ? (
            <SkipForward className="w-4 h-4 text-white" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </motion.div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[40px] ${
            step.status === 'completed' ? 'bg-emerald-300' : 'bg-gray-200'
          }`} />
        )}
      </div>

      {/* Step content */}
      <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
        <motion.div
          whileHover={{ x: 2 }}
          className={`rounded-2xl border p-4 transition-all cursor-pointer ${
            step.status === 'completed'
              ? 'bg-emerald-50/50 border-emerald-100'
              : step.status === 'current'
                ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100'
                : step.status === 'skipped'
                  ? 'bg-gray-50 border-gray-100 opacity-70'
                  : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-0 ${config.bgColor} ${config.color}`}>
                  <Icon className="w-3 h-3 mr-0.5" />
                  {config.label}
                </Badge>
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-0 ${
                  step.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  step.status === 'current' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {STATUS_CONFIG[step.status].label}
                </Badge>
              </div>
              <h4 className={`text-sm font-semibold ${step.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {step.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{step.description}</p>
            </div>
            {step.status !== 'completed' && step.status !== 'skipped' && (
              <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            )}
          </div>

          {/* Due date */}
          {!expanded && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className={`text-[11px] ${daysLeft <= 3 && step.status === 'current' ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                {formatDate(step.dueDate)}
                {step.status === 'current' && daysLeft > 0 && (
                  <span className="ml-1.5">— {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</span>
                )}
              </span>
            </div>
          )}
        </motion.div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 space-y-3"
            >
              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed px-1">{step.description}</p>

              {/* Due date editing */}
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {editingDate ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="h-8 w-40 text-xs rounded-lg"
                    />
                    <Button size="sm" onClick={handleSaveDate} className="h-7 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700">OK</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDate(false)} className="h-7 text-xs rounded-lg">Annuler</Button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingDate(true) }}
                    className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <span>Échéance : {formatDate(step.dueDate)}</span>
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Resources */}
              {step.resources.length > 0 && (
                <div className="px-1">
                  <p className="text-xs font-medium text-gray-600 mb-2">Ressources</p>
                  <div className="space-y-1.5">
                    {step.resources.map((resource, i) => {
                      const ResIcon = RESOURCE_ICON[resource.type] || Link2
                      return (
                        <a
                          key={i}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-indigo-50">
                            <ResIcon className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 truncate">{resource.title}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{resource.type}</p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 px-1 pt-1">
                {step.status === 'current' && (
                  <Button
                    onClick={(e) => { e.stopPropagation(); onComplete(step.id) }}
                    className="h-8 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Marquer comme terminé
                  </Button>
                )}
                {step.status === 'current' && (
                  <Button
                    onClick={(e) => { e.stopPropagation(); onSkip(step.id) }}
                    variant="ghost"
                    className="h-8 text-xs text-gray-400 hover:text-gray-600 rounded-xl"
                  >
                    <SkipForward className="w-3.5 h-3.5 mr-1" />
                    Ignorer
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ==================== MOCK DATA ====================
function getMockPath(): PersonalizedPath {
  return {
    id: 'path-1',
    userId: 'user-1',
    progress: 35,
    badges: [
      { id: 'b1', name: 'Premier pas', icon: '🚀', earned: true, earnedDate: '2024-12-15' },
      { id: 'b2', name: 'Explorateur', icon: '🧭', earned: true, earnedDate: '2024-12-20' },
      { id: 'b3', name: 'Stratège', icon: '♟️', earned: false },
      { id: 'b4', name: 'Visionnaire', icon: '🔮', earned: false },
      { id: 'b5', name: 'Entrepreneur', icon: '🏆', earned: false },
    ],
    streakDays: 12,
    nextAction: 'Valider votre étude de marché',
    createdAt: '2024-12-01',
    steps: [
      {
        id: 's1', title: 'Définir votre idée de projet', description: 'Clarifiez votre concept, votre proposition de valeur et votre public cible. Rédigez un pitch deck d\'une page.',
        type: 'action', status: 'completed', order: 1, dueDate: '2024-12-10',
        resources: [
          { title: 'Guide : Comment définir sa proposition de valeur', type: 'document', url: '#' },
          { title: 'Template Pitch Deck', type: 'document', url: '#' },
        ],
      },
      {
        id: 's2', title: 'Explorer votre profil entrepreneurial (RIASEC)', description: 'Complétez le bilan RIASEC et le Jeu des Pépites pour identifier vos forces et motivations.',
        type: 'content', status: 'completed', order: 2, dueDate: '2024-12-18',
        resources: [
          { title: 'Module RIASEC', type: 'link', url: '#' },
          { title: 'Jeu des Pépites', type: 'link', url: '#' },
          { title: 'Vidéo : Comprendre votre profil RIASEC', type: 'video', url: '#' },
        ],
      },
      {
        id: 's3', title: 'Réaliser votre étude de marché', description: 'Analysez votre marché cible, identifiez vos concurrents et validez la demande pour votre produit ou service.',
        type: 'action', status: 'current', order: 3, dueDate: '2025-02-01',
        resources: [
          { title: 'Guide étude de marché Bpifrance', type: 'document', url: '#' },
          { title: 'Outils d\'analyse concurrentielle', type: 'link', url: '#' },
          { title: 'Webinaire : Les clés de l\'étude de marché', type: 'video', url: '#' },
        ],
      },
      {
        id: 's4', title: 'Formation : Les bases du business model', description: 'Suivez cette formation de 3h pour structurer votre modèle économique avec le Business Model Canvas.',
        type: 'training', status: 'upcoming', order: 4, dueDate: '2025-02-15',
        resources: [
          { title: 'Formation Business Model Canvas', type: 'video', url: '#' },
          { title: 'Template Canvas à télécharger', type: 'document', url: '#' },
        ],
      },
      {
        id: 's5', title: 'Rencontre avec un conseiller Bpifrance', description: 'Prenez rendez-vous avec un conseiller pour discuter de votre projet et bénéficier d\'un premier avis d\'expert.',
        type: 'meeting', status: 'upcoming', order: 5, dueDate: '2025-03-01',
        resources: [
          { title: 'Prendre rendez-vous Bpifrance', type: 'link', url: '#' },
          { title: 'Préparer votre rendez-vous : checklist', type: 'document', url: '#' },
        ],
      },
      {
        id: 's6', title: 'Choisir votre statut juridique', description: 'Explorez les options juridiques disponibles et utilisez le simulateur pour comparer les régimes.',
        type: 'content', status: 'upcoming', order: 6, dueDate: '2025-03-15',
        resources: [
          { title: 'Comparateur de statuts juridiques', type: 'link', url: '#' },
          { title: 'Simulateur de charges', type: 'link', url: '#' },
          { title: 'Guide juridique du créateur', type: 'document', url: '#' },
        ],
      },
      {
        id: 's7', title: 'Élaborer votre prévisionnel financier', description: 'Construisez vos prévisions financières sur 3 ans : compte de résultat, plan de trésorerie et bilan prévisionnel.',
        type: 'action', status: 'upcoming', order: 7, dueDate: '2025-04-01',
        resources: [
          { title: 'Template prévisionnel Excel', type: 'document', url: '#' },
          { title: 'Formation : Initiation à la finance', type: 'video', url: '#' },
        ],
      },
    ],
  }
}

// ==================== MAIN COMPONENT ====================
export default function PersonalizedPath() {
  const [pathData, setPathData] = useState<PersonalizedPath | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [hasPath, setHasPath] = useState(false)
  const [showQuote, setShowQuote] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await fetchJson<PersonalizedPath>('/api/personalized-path', null)
      if (data && data.steps && data.steps.length > 0) {
        setPathData(data)
        setHasPath(true)
      }
      setLoading(false)
    }
    load()
  }, [])

  const generatePath = useCallback(async () => {
    setGenerating(true)
    const data = await fetchJson<PersonalizedPath>('/api/personalized-path', null, {
      method: 'POST',
      body: JSON.stringify({ generate: true }),
    })
    if (data && data.steps) {
      setPathData(data)
      setHasPath(true)
    } else {
      setPathData(getMockPath())
      setHasPath(true)
    }
    setGenerating(false)
  }, [])

  const completeStep = useCallback(async (id: string) => {
    if (!pathData) return
    const updatedSteps = pathData.steps.map((s) =>
      s.id === id ? { ...s, status: 'completed' as StepStatus } : s
    )
    const currentIdx = updatedSteps.findIndex((s) => s.id === id)
    const nextStep = updatedSteps.find((s, i) => i > currentIdx && s.status === 'upcoming')
    if (nextStep) {
      nextStep.status = 'current'
    }
    const completedCount = updatedSteps.filter((s) => s.status === 'completed').length
    const progress = Math.round((completedCount / updatedSteps.length) * 100)
    const newPath = { ...pathData, steps: updatedSteps, progress }
    setPathData(newPath)
    await fetchJson(`/api/personalized-path/${id}/complete`, null, { method: 'POST' })
  }, [pathData])

  const skipStep = useCallback(async (id: string) => {
    if (!pathData) return
    const updatedSteps = pathData.steps.map((s) =>
      s.id === id ? { ...s, status: 'skipped' as StepStatus } : s
    )
    const currentIdx = updatedSteps.findIndex((s) => s.id === id)
    const nextStep = updatedSteps.find((s, i) => i > currentIdx && s.status === 'upcoming')
    if (nextStep) {
      nextStep.status = 'current'
    }
    const completedCount = updatedSteps.filter((s) => s.status === 'completed').length
    const progress = Math.round((completedCount / updatedSteps.length) * 100)
    setPathData({ ...pathData, steps: updatedSteps, progress })
    await fetchJson(`/api/personalized-path/${id}/skip`, null, { method: 'POST' })
  }, [pathData])

  const editStepDate = useCallback(async (id: string, date: string) => {
    if (!pathData) return
    const updatedSteps = pathData.steps.map((s) =>
      s.id === id ? { ...s, dueDate: date } : s
    )
    setPathData({ ...pathData, steps: updatedSteps })
    await fetchJson(`/api/personalized-path/${id}/date`, null, {
      method: 'PATCH',
      body: JSON.stringify({ dueDate: date }),
    })
  }, [pathData])

  const currentStep = pathData?.steps.find((s) => s.status === 'current')
  const completedCount = pathData?.steps.filter((s) => s.status === 'completed').length ?? 0
  const totalSteps = pathData?.steps.length ?? 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chargement de votre parcours...</p>
        </div>
      </div>
    )
  }

  if (!hasPath) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Votre parcours personnalisé</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Basé sur vos résultats RIASEC, vos pépites et votre profil, nous allons créer un parcours sur mesure pour vous accompagner vers la création de votre entreprise.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-left">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-xs text-gray-600">Connecté à votre profil RIASEC</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-gray-600">Intègre vos pépites et soft skills</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-left">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-xs text-gray-600">Intelligence artificielle pour la personnalisation</span>
                </div>
              </div>
              <Button
                onClick={generatePath}
                disabled={generating}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-medium text-sm shadow-lg shadow-indigo-200"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer mon parcours
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!pathData) return null

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          {/* Header */}
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon parcours personnalisé</h1>
              <p className="text-sm text-gray-500 mt-1">
                {completedCount}/{totalSteps} étapes complétées · Créé le {formatDate(pathData.createdAt)}
              </p>
            </div>
            <Button
              onClick={generatePath}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              disabled={generating}
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
              Régénérer
            </Button>
          </motion.div>

          {/* Dashboard Section */}
          <motion.div variants={fadeIn}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Circular Progress */}
              <Card className="border-0 shadow-sm md:row-span-2">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <CircularProgress value={pathData.progress} />
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-gray-900">{completedCount} étape{completedCount > 1 ? 's' : ''} terminée{completedCount > 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{totalSteps - completedCount} restante{totalSteps - completedCount > 1 ? 's' : ''}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Badges */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Badges obtenus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {pathData.badges.map((badge) => (
                      <motion.div
                        key={badge.id}
                        whileHover={{ scale: 1.05 }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          badge.earned
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-50 text-gray-400 border border-gray-200 opacity-50'
                        }`}
                        title={badge.earned ? `Obtenu le ${badge.earnedDate ? formatDate(badge.earnedDate) : ''}` : 'Pas encore obtenu'}
                      >
                        <span className="text-sm">{badge.icon}</span>
                        {badge.name}
                        {badge.earned && <CheckCircle2 className="w-3 h-3 text-amber-500" />}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Streak & Next Action */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{pathData.streakDays}</p>
                      <p className="text-[11px] text-gray-500">jours consécutifs</p>
                    </div>
                  </div>
                  <Separator />
                  {currentStep && (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                      <p className="text-[11px] font-medium text-indigo-500 mb-1">Prochaine action</p>
                      <p className="text-xs font-semibold text-indigo-700">{pathData.nextAction}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span className="text-[11px] text-indigo-500">{getDaysRemaining(currentStep.dueDate)} jour{getDaysRemaining(currentStep.dueDate) > 1 ? 's' : ''} restant{getDaysRemaining(currentStep.dueDate) > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Motivational Quote */}
              <Card className="border-0 shadow-sm md:col-span-2">
                <CardContent className="p-4">
                  <MotivationalQuote />
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div variants={fadeIn}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                  Étapes du parcours
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="space-y-0">
                  {pathData.steps.map((step, index) => (
                    <StepCard
                      key={step.id}
                      step={step}
                      isLast={index === pathData.steps.length - 1}
                      onComplete={completeStep}
                      onSkip={skipStep}
                      onEditDate={editStepDate}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

function Compass(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}
