'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sparkles,
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Download,
  Brain,
  Target,
  FileCheck,
  X,
  ChevronRight,
  Loader2,
  Eye,
  Lightbulb,
  Rocket,
  MapPin,
  Star,
  Clock,
  Layers,
  Zap,
  Trophy,
} from 'lucide-react'
import { useAppStore } from '@/hooks/use-store'

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface KiviatDimension {
  label: string
  value: number
  maxValue: number
}

interface SwipeCard {
  id: string
  title: string
  description: string
  icon: string
  category: string
  gradient: string
}

interface VisionInsight {
  title: string
  description: string
}

interface BilanSection {
  title: string
  content: string
  type: string
}

interface BilanResult {
  sections: BilanSection[]
  viabilityScore: number
}

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  { id: 1, label: 'CV Live', sublabel: "L'Ancre", icon: FileCheck },
  { id: 2, label: 'Vision', sublabel: 'Le Contexte', icon: Eye },
  { id: 3, label: 'Radar', sublabel: 'Talents', icon: Layers },
] as const

const VISION_QUESTIONS = [
  {
    key: 'project',
    question: 'Quel est votre projet entrepreneurial ?',
    type: 'textarea' as const,
    placeholder: 'Décrivez votre idée de business, votre produit ou service…',
  },
  {
    key: 'location',
    question: 'Où est-il situé ?',
    type: 'chips' as const,
    placeholder: 'Ex: Paris, Bretagne, en ligne…',
    options: ['Local', 'Régional', 'National', 'International', 'En ligne'],
  },
  {
    key: 'uniqueness',
    question: "Qu'est-ce qui le rend unique ?",
    type: 'textarea' as const,
    placeholder: 'Différenciation, innovation, savoir-faire unique…',
    hasAiRephrase: true,
  },
  {
    key: 'positioning',
    question: 'Quel est votre positionnement ?',
    type: 'chips' as const,
    placeholder: '',
    options: ['Artisanal', 'Premium', 'Économique', 'Écologique', 'Innovant', 'Social'],
  },
  {
    key: 'timeline',
    question: 'Quelle est votre timeline ?',
    type: 'chips' as const,
    placeholder: '',
    options: ['3 mois', '6 mois', '1 an', '2 ans', 'Sans limite'],
  },
]

const RADAR_CARDS_POOL: SwipeCard[] = [
  { id: 's1', title: 'Leadership', description: 'Inspirer et guider une équipe vers des objectifs communs.', icon: '👑', category: 'Compétences', gradient: 'from-amber-400 to-orange-500' },
  { id: 's2', title: 'Négociation', description: 'Obtenir des accords gagnant-gagnant dans des situations complexes.', icon: '🤝', category: 'Compétences', gradient: 'from-emerald-400 to-teal-500' },
  { id: 's3', title: 'Veille stratégique', description: 'Surveiller les tendances et anticiper les évolutions du marché.', icon: '🔭', category: 'Compétences', gradient: 'from-sky-400 to-blue-500' },
  { id: 's4', title: 'Gestion financière', description: 'Piloter budgets, trésorerie et comptabilité avec rigueur.', icon: '💰', category: 'Compétences', gradient: 'from-violet-400 to-purple-500' },
  { id: 's5', title: 'Marketing digital', description: 'Maîtriser les leviers numériques pour attirer et convertir.', icon: '📱', category: 'Compétences', gradient: 'from-pink-400 to-rose-500' },
  { id: 's6', title: 'Créativité', description: 'Générer des idées originales et penser hors des sentiers battus.', icon: '💡', category: 'Appétences', gradient: 'from-yellow-400 to-amber-500' },
  { id: 's7', title: 'Empathie', description: 'Comprendre profondément les besoins et émotions des autres.', icon: '❤️', category: 'Appétences', gradient: 'from-red-400 to-pink-500' },
  { id: 's8', title: 'Curiosité', description: 'Explorer de nouveaux domaines avec un appétit insatiable pour apprendre.', icon: '🔍', category: 'Appétences', gradient: 'from-cyan-400 to-teal-500' },
  { id: 's9', title: 'Persévérance', description: 'Maintenir cap et motivation malgré les obstacles.', icon: '🧗', category: 'Appétences', gradient: 'from-lime-400 to-green-500' },
  { id: 's10', title: 'Esprit critique', description: 'Évaluer objectivement les situations et remettre en question les hypothèses.', icon: '🧠', category: 'Appétences', gradient: 'from-fuchsia-400 to-violet-500' },
  { id: 's11', title: 'Python', description: 'Langage de programmation polyvalent pour l\'analyse de données et l\'automatisation.', icon: '🐍', category: 'Pépites', gradient: 'from-green-400 to-emerald-500' },
  { id: 's12', title: 'UX Design', description: 'Concevoir des expériences utilisateur intuitives et engageantes.', icon: '🎨', category: 'Pépites', gradient: 'from-indigo-400 to-blue-500' },
  { id: 's13', title: 'Dropshipping', description: 'Modèle de vente en ligne sans gestion de stock physique.', icon: '📦', category: 'Pépites', gradient: 'from-orange-400 to-red-500' },
  { id: 's14', title: 'SEO', description: 'Optimiser la visibilité d\'un site web dans les moteurs de recherche.', icon: '🔎', category: 'Pépites', gradient: 'from-teal-400 to-cyan-500' },
  { id: 's15', title: 'Community Management', description: 'Animer et développer une communauté engagée autour d\'une marque.', icon: '📣', category: 'Pépites', gradient: 'from-rose-400 to-pink-500' },
  { id: 's16', title: 'Photographie produit', description: 'Réaliser des visuels professionnels pour mettre en valeur vos offres.', icon: '📷', category: 'Pépites', gradient: 'from-sky-400 to-indigo-500' },
  { id: 's17', title: 'Résilience', description: 'Rebondir après un échec et transformer les setbacks en opportunités.', icon: '💪', category: 'Appétences', gradient: 'from-amber-500 to-orange-600' },
  { id: 's18', title: 'Pitch', description: 'Présenter un projet de manière claire, convaincante et mémorable.', icon: '🎤', category: 'Compétences', gradient: 'from-purple-400 to-fuchsia-500' },
  { id: 's19', title: 'Intelligence artificielle', description: 'Exploiter les outils IA pour automatiser et innover.', icon: '🤖', category: 'Pépites', gradient: 'from-slate-400 to-zinc-500' },
  { id: 's20', title: 'Réseautage', description: 'Construire et entretenir un réseau professionnel stratégique.', icon: '🌐', category: 'Compétences', gradient: 'from-emerald-500 to-green-600' },
]

const DEFAULT_INSIGHTS = [
  '💡 Votre CV est la fondation de votre profil créateur. Plus il est détaillé, plus nos analyses seront pertinentes.',
  '🚀 Les compétences transférables sont un atout majeur pour les créateurs d\'entreprise.',
  '🎯 Ne sous-estimez pas vos compétences acquises dans des contextes non professionnels.',
  '⭐ Un profil créateur complet permet de générer un bilan IA personnalisé et exploitable.',
  '🌟 Chaque étape du parcours enrichit votre profil et affine vos recommandations.',
]

/* ------------------------------------------------------------------ */
/*  INLINE KIVIAT CHART (SVG)                                          */
/* ------------------------------------------------------------------ */

function InlineKiviatChart({
  acquis,
  aspirations,
  size = 220,
  className = '',
}: {
  acquis: KiviatDimension[]
  aspirations: KiviatDimension[]
  size?: number
  className?: string
}) {
  const center = size / 2
  const radius = size / 2 - 30
  const n = acquis.length || 6

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pointFor = (i: number, value: number, max: number) => {
    const r = (value / (max || 100)) * radius
    const a = angleFor(i)
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) }
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]

  const polygonPoints = (values: KiviatDimension[]) =>
    values
      .map((d, i) => {
        const p = pointFor(i, d.value, d.maxValue)
        return `${p.x},${p.y}`
      })
      .join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Graphique Kiviat comparatif : acquis en vert, aspirations en violet"
    >
      {/* Grid */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={Array.from({ length: n }, (_, i) => {
            const a = angleFor(i)
            const r = level * radius
            return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`
          }).join(' ')}
          fill="none"
          stroke="currentColor"
          className="text-muted-foreground/20"
          strokeWidth={1}
        />
      ))}
      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const a = angleFor(i)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(a)}
            y2={center + radius * Math.sin(a)}
            className="text-muted-foreground/15"
            stroke="currentColor"
            strokeWidth={1}
          />
        )
      })}
      {/* Aspirations polygon */}
      {aspirations.length > 0 && (
        <polygon
          points={polygonPoints(aspirations)}
          fill="rgba(139, 92, 246, 0.15)"
          stroke="rgb(139, 92, 246)"
          strokeWidth={2}
          className="transition-all duration-500"
        />
      )}
      {/* Acquis polygon */}
      {acquis.length > 0 && (
        <polygon
          points={polygonPoints(acquis)}
          fill="rgba(16, 185, 129, 0.15)"
          stroke="rgb(16, 185, 129)"
          strokeWidth={2}
          className="transition-all duration-500"
        />
      )}
      {/* Labels */}
      {acquis.map((d, i) => {
        const a = angleFor(i)
        const lr = radius + 18
        const lx = center + lr * Math.cos(a)
        const ly = center + lr * Math.sin(a)
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={9}
          >
            {d.label.length > 16 ? d.label.slice(0, 14) + '…' : d.label}
          </text>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  VIABILITY GAUGE                                                    */
/* ------------------------------------------------------------------ */

function ViabilityGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 75
      ? 'text-emerald-500'
      : score >= 50
        ? 'text-amber-500'
        : 'text-red-500'

  const label =
    score >= 75
      ? 'Excellent'
      : score >= 50
        ? 'Bon potentiel'
        : score >= 25
          ? 'À renforcer'
          : 'En construction'

  return (
    <div className="flex flex-col items-center gap-2" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Score de viabilité : ${score} sur 100`}>
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" className="stroke-muted-foreground/15" strokeWidth={10} fill="none" />
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          className={color}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="55" textAnchor="middle" className="fill-foreground" fontSize="28" fontWeight="bold">
          {score}
        </text>
        <text x="60" y="72" textAnchor="middle" className="fill-muted-foreground" fontSize="10">
          / 100
        </text>
      </svg>
      <Badge variant="secondary" className={color}>
        {label}
      </Badge>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  LOADING SKELETON                                                   */
/* ------------------------------------------------------------------ */

function StepSkeleton() {
  return (
    <div className="space-y-4 p-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function ParcoursCreateur() {
  const userId = useAppStore((s) => s.userId)

  /* ---- state ---- */
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)

  // Step 1
  const [cvData, setCvData] = useState<{ fileName?: string; parsedSkills?: string[] } | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [manualCv, setManualCv] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2
  const [visionQuestionIdx, setVisionQuestionIdx] = useState(0)
  const [visionAnswers, setVisionAnswers] = useState<Record<string, string>>({})
  const [visionInsights, setVisionInsights] = useState<VisionInsight[]>([])
  const [visionLoading, setVisionLoading] = useState(false)
  const [visionSummary, setVisionSummary] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false)

  // Step 3
  const [swipeCards, setSwipeCards] = useState<SwipeCard[]>([])
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [swipeResults, setSwipeResults] = useState({ kept: 0, passed: 0, total: 0 })
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [swipeFinished, setSwipeFinished] = useState(false)

  // Results
  const [kiviatAcquis, setKiviatAcquis] = useState<KiviatDimension[]>([])
  const [kiviatAspirations, setKiviatAspirations] = useState<KiviatDimension[]>([])
  const [bilan, setBilan] = useState<BilanResult | null>(null)
  const [bilanLoading, setBilanLoading] = useState(false)

  // Insight banner
  const [insightBanner, setInsightBanner] = useState<string | null>(DEFAULT_INSIGHTS[0])
  const [insightIndex, setInsightIndex] = useState(0)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18])
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  /* ---- insight banner cycling ---- */
  useEffect(() => {
    const timer = setInterval(() => {
      setInsightIndex((prev) => {
        const next = (prev + 1) % DEFAULT_INSIGHTS.length
        setInsightBanner(DEFAULT_INSIGHTS[next])
        return next
      })
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  /* ---- fetch session on mount ---- */
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/parcours-creteur/session')
        if (!res.ok) return
        const data = await res.json()
        const sess = data.session
        if (sess) {
          setCurrentStep(sess.currentStep || 1)
          const savedVision = sess.visionAnswers as Record<string, string> | undefined
          if (savedVision && Object.keys(savedVision).length > 0) {
            setVisionAnswers(savedVision)
            const filledKeys = VISION_QUESTIONS.filter((q) => savedVision[q.key])
            if (filledKeys.length >= VISION_QUESTIONS.length) {
              setVisionSummary(true)
              setVisionQuestionIdx(VISION_QUESTIONS.length - 1)
            } else {
              setVisionQuestionIdx(filledKeys.length)
            }
          }
          if (sess.swipeProgress) {
            const sp = sess.swipeProgress as { kept: number; passed: number; total: number }
            setSwipeResults(sp)
            if (sp.total >= 20) {
              setSwipeFinished(true)
            }
          }
          if (data.cvUpload) {
            setCvData({
              fileName: data.cvUpload.fileName,
              parsedSkills: data.cvUpload.parsedSkills,
            })
          }
        }
      } catch {
        // silent fallback
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [userId])

  /* ---- fetch radar cards ---- */
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch('/api/parcours-creteur/radar')
        if (!res.ok) return
        const data = await res.json()
        if (data.results && data.results.length > 0) {
          const mapped: SwipeCard[] = data.results.map((r: { skillId: string; skillName: string; kept: boolean }, idx: number) => {
            const template = RADAR_CARDS_POOL[idx % RADAR_CARDS_POOL.length]
            return {
              id: r.skillId,
              title: r.skillName || template.title,
              description: template.description,
              icon: template.icon,
              category: template.category,
              gradient: template.gradient,
            }
          })
          setSwipeCards(mapped)
          setSwipeIndex(mapped.length)
        } else {
          // Use local pool if API has no results yet
          setSwipeCards(RADAR_CARDS_POOL)
        }
      } catch {
        setSwipeCards(RADAR_CARDS_POOL)
      }
    }
    if (userId) fetchCards()
  }, [userId])

  /* ---- helpers ---- */
  const goToStep = useCallback(
    (step: number) => {
      setDirection(step > currentStep ? 'forward' : 'backward')
      setCurrentStep(step)
    },
    [currentStep],
  )

  const updateSession = useCallback(
    async (patch: { currentStep?: number; visionAnswers?: Record<string, string> }) => {
      try {
        await fetch('/api/parcours-creteur/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
      } catch {
        // silent
      }
    },
    [],
  )

  /* ================================================================ */
  /*  STEP 1: CV UPLOAD                                                */
  /* ================================================================ */

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!userId) return
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowed.includes(file.type)) {
        alert('Type de fichier non supporté. Utilisez PDF, DOC ou DOCX.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Fichier trop volumineux (max 10 Mo).')
        return
      }

      setLoading(true)
      setUploadProgress(10)

      try {
        const formData = new FormData()
        formData.append('file', file)
        setUploadProgress(30)

        const res = await fetch('/api/upload/cv', { method: 'POST', body: formData })
        setUploadProgress(70)

        if (!res.ok) {
          const err = await res.json()
          alert(err.error || 'Erreur lors de l\'upload.')
          return
        }

        const data = await res.json()
        setUploadProgress(90)

        // Fetch updated CV data
        const cvRes = await fetch(`/api/upload/cv?userId=${userId}`)
        if (cvRes.ok) {
          const cvInfo = await cvRes.json()
          setCvData({ fileName: cvInfo.fileName, parsedSkills: cvInfo.parsedSkills })
        }

        setUploadProgress(100)
      } catch {
        alert('Erreur lors de l\'upload. Veuillez réessayer.')
      } finally {
        setTimeout(() => {
          setLoading(false)
          setUploadProgress(0)
        }, 500)
      }
    },
    [userId],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload],
  )

  const handleManualCvSubmit = useCallback(async () => {
    if (!manualCv.trim() || !userId) return
    setLoading(true)
    try {
      const res = await fetch('/api/upload/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualText: manualCv }),
      })
      if (res.ok) {
        const cvRes = await fetch(`/api/upload/cv?userId=${userId}`)
        if (cvRes.ok) {
          const cvInfo = await cvRes.json()
          setCvData({ fileName: 'CV manuel', parsedSkills: cvInfo.parsedSkills })
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [manualCv, userId])

  /* ================================================================ */
  /*  STEP 2: VISION                                                   */
  /* ================================================================ */

  const handleVisionAnswer = useCallback(
    (key: string, value: string) => {
      const updated = { ...visionAnswers, [key]: value }
      setVisionAnswers(updated)
    },
    [visionAnswers],
  )

  const handleVisionNext = useCallback(() => {
    if (visionQuestionIdx < VISION_QUESTIONS.length - 1) {
      setVisionQuestionIdx((p) => p + 1)
    } else {
      submitVision()
    }
  }, [visionQuestionIdx, visionAnswers])

  const handleVisionBack = useCallback(() => {
    if (visionQuestionIdx > 0) {
      setVisionQuestionIdx((p) => p - 1)
    }
  }, [visionQuestionIdx])

  const submitVision = useCallback(async () => {
    if (!userId) return
    setVisionLoading(true)
    try {
      const res = await fetch('/api/parcours-creteur/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: visionAnswers }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.insights) setVisionInsights(data.insights)
        setVisionSummary(true)
        updateSession({ currentStep: 3, visionAnswers })
      }
    } catch {
      // silent
    } finally {
      setVisionLoading(false)
    }
  }, [userId, visionAnswers, updateSession])

  const handleAiSuggestion = useCallback(async () => {
    if (!userId) return
    const currentQ = VISION_QUESTIONS[visionQuestionIdx]
    const currentAnswer = visionAnswers[currentQ.key] || ''
    if (!currentAnswer.trim()) {
      setAiSuggestion('Remplissez d\'abord votre réponse pour obtenir une suggestion IA.')
      return
    }
    setAiSuggestionLoading(true)
    setAiSuggestion(null)
    try {
      const res = await fetch('/api/parcours-creteur/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { [currentQ.key]: currentAnswer } }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.insights && data.insights.length > 0) {
          setAiSuggestion(data.insights[0].description)
        }
      }
    } catch {
      setAiSuggestion('Impossible de générer une suggestion. Réessayez plus tard.')
    } finally {
      setAiSuggestionLoading(false)
    }
  }, [userId, visionQuestionIdx, visionAnswers])

  /* ================================================================ */
  /*  STEP 3: RADAR SWIPE                                              */
  /* ================================================================ */

  const currentCard = swipeCards[swipeIndex]

  const handleSwipe = useCallback(
    async (dir: 'left' | 'right') => {
      if (!currentCard || !userId) return
      const kept = dir === 'right'
      setExitDirection(dir)

      const newResults = {
        kept: swipeResults.kept + (kept ? 1 : 0),
        passed: swipeResults.passed + (kept ? 0 : 1),
        total: swipeResults.total + 1,
      }
      setSwipeResults(newResults)

      try {
        await fetch('/api/parcours-creteur/radar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId: currentCard.id, kept }),
        })
      } catch {
        // silent
      }

      setTimeout(() => {
        if (swipeIndex + 1 >= swipeCards.length) {
          setSwipeFinished(true)
        } else {
          setSwipeIndex((p) => p + 1)
        }
        setExitDirection(null)
        x.set(0)
      }, 300)
    },
    [currentCard, userId, swipeResults, swipeIndex, swipeCards.length, x],
  )

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) handleSwipe('right')
    else if (info.offset.x < -100) handleSwipe('left')
  }

  /* ================================================================ */
  /*  RESULTS                                                          */
  /* ================================================================ */

  const fetchKiviatData = useCallback(async () => {
    try {
      const res = await fetch('/api/parcours-creteur/kiviat')
      if (res.ok) {
        const data = await res.json()
        setKiviatAcquis(data.acquis || [])
        setKiviatAspirations(data.aspirations || [])
      }
    } catch {
      // silent
    }
  }, [])

  const handleFinishRadar = useCallback(async () => {
    updateSession({ currentStep: 3 })
    setShowResults(true)
    await fetchKiviatData()
  }, [updateSession, fetchKiviatData])

  const handleGenerateBilan = useCallback(async () => {
    if (!userId) return
    setBilanLoading(true)
    try {
      const res = await fetch('/api/parcours-creteur/bilan', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setBilan(data.bilan)
      }
    } catch {
      // silent
    } finally {
      setBilanLoading(false)
    }
  }, [userId])

  const handleExportPdf = useCallback(() => {
    if (!bilan) return
    const content = bilan.sections.map((s) => `# ${s.title}\n\n${s.content}`).join('\n\n---\n\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bilan-createur.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [bilan])

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  if (loading && currentStep === 1 && !cvData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8" role="status" aria-label="Chargement du parcours créateur">
        <Skeleton className="h-12 w-full rounded-xl mb-6" />
        <StepSkeleton />
        <StepSkeleton />
      </div>
    )
  }

  const slideVariants = {
    enter: (d: 'forward' | 'backward') => ({ x: d === 'forward' ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 'forward' | 'backward') => ({ x: d === 'forward' ? -300 : 300, opacity: 0 }),
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* ---- HEADER / STEP INDICATOR ---- */}
      <Card className="border-emerald-200/60 bg-gradient-to-r from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-background" role="navigation" aria-label="Étapes du parcours créateur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-600" />
              <h1 className="text-lg font-bold text-foreground">Mon Profil Créateur</h1>
            </div>
            {!showResults && (
              <span className="text-sm text-muted-foreground">
                Étape {currentStep} sur 3
              </span>
            )}
            {showResults && (
              <Badge className="bg-emerald-600 text-white">
                <Trophy className="w-3 h-3 mr-1" />
                Terminé
              </Badge>
            )}
          </div>

          {!showResults ? (
            <>
              <Progress value={(currentStep / 3) * 100} className="h-2 mb-4" aria-label={`Progression : étape ${currentStep} sur 3`} />
              <div className="grid grid-cols-3 gap-2">
                {STEPS.map((step) => {
                  const Icon = step.icon
                  const isActive = currentStep === step.id
                  const isDone = currentStep > step.id
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        if (isDone) goToStep(step.id)
                      }}
                      disabled={!isDone && !isActive}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all text-center
                        ${isActive ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300' : ''}
                        ${isDone ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer dark:bg-emerald-900/40 dark:text-emerald-300' : ''}
                        ${!isActive && !isDone ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}
                      `}
                      aria-current={isActive ? 'step' : undefined}
                      aria-label={`Étape ${step.id} : ${step.label} — ${step.sublabel}${isActive ? ' (en cours)' : isDone ? ' (terminée)' : ' (non disponible)'}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{step.label}</span>
                      <span className="text-[10px] opacity-80">{step.sublabel}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                🎉 Parcours terminé ! Consultez vos résultats ci-dessous.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- INSIGHT BANNER ---- */}
      {insightBanner && !showResults && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 flex items-start gap-3"
          role="status"
          aria-live="polite"
        >
          <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-200 flex-1 leading-relaxed">
            {insightBanner}
          </p>
          <button
            onClick={() => setInsightBanner(null)}
            className="shrink-0 p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            aria-label="Masquer le conseil"
          >
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </motion.div>
      )}

      {/* ---- MAIN CONTENT (animated) ---- */}
      <div className="min-h-[420px] relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {!showResults ? (
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full"
            >
              {/* ============ STEP 1: CV ============ */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <CardTitle className="text-xl">CV Live — L'Ancre</CardTitle>
                    </div>
                    <CardDescription>
                      Importez votre CV ou décrivez votre parcours pour enrichir votre profil créateur.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cvData && cvData.fileName ? (
                      /* Existing CV summary */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <FileText className="w-8 h-8 text-emerald-600" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{cvData.fileName}</p>
                            <p className="text-sm text-muted-foreground">CV analysé avec succès</p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>

                        {cvData.parsedSkills && cvData.parsedSkills.length > 0 && (
                          <div>
                            <Label className="mb-2 block">Compétences extraites</Label>
                            <div className="flex flex-wrap gap-2">
                              {cvData.parsedSkills.map((skill, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => {
                            setCvData(null)
                            setManualCv('')
                          }}
                          className="w-full"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Modifier le CV
                        </Button>
                      </motion.div>
                    ) : (
                      <>
                        {/* Upload zone */}
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label="Zone de dépôt pour votre CV. Cliquez ou glissez un fichier PDF, DOC ou DOCX."
                          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                            ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 scale-[1.02]' : 'border-muted-foreground/25 hover:border-emerald-400 hover:bg-muted/30'}
                          `}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                            aria-hidden="true"
                          />
                          <Upload className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
                          <p className="font-medium text-foreground mb-1">
                            Glissez votre CV ici
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">
                            ou cliquez pour parcourir (PDF, DOC, DOCX — max 10 Mo)
                          </p>
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="max-w-xs mx-auto">
                              <Progress value={uploadProgress} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
                            </div>
                          )}
                        </div>

                        <div className="relative flex items-center gap-4">
                          <Separator className="flex-1" />
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">ou</span>
                          <Separator className="flex-1" />
                        </div>

                        {/* Manual CV */}
                        <div className="space-y-2">
                          <Label htmlFor="manual-cv">Décrivez votre parcours directement</Label>
                          <Textarea
                            id="manual-cv"
                            placeholder="Racontez votre parcours professionnel, vos compétences, vos expériences clés…"
                            value={manualCv}
                            onChange={(e) => setManualCv(e.target.value)}
                            rows={5}
                            className="resize-none"
                          />
                          <Button
                            onClick={handleManualCvSubmit}
                            disabled={!manualCv.trim() || loading}
                            variant="outline"
                            className="w-full"
                          >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                            Enregistrer mon parcours
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ============ STEP 2: VISION ============ */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-emerald-600" />
                      <CardTitle className="text-xl">Vision — Le Contexte du Projet</CardTitle>
                    </div>
                    <CardDescription>
                      Définissez votre vision entrepreneuriale en quelques questions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-2 mb-6" aria-label={`Question ${visionQuestionIdx + 1} sur ${VISION_QUESTIONS.length}`}>
                      {VISION_QUESTIONS.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { if (i < visionQuestionIdx || (i === visionQuestionIdx + 1 && visionAnswers[VISION_QUESTIONS[visionQuestionIdx]?.key])) setVisionQuestionIdx(i) }}
                          className={`w-3 h-3 rounded-full transition-all ${
                            i === visionQuestionIdx
                              ? 'bg-emerald-600 scale-125 ring-2 ring-emerald-300'
                              : i < visionQuestionIdx
                                ? 'bg-emerald-400'
                                : 'bg-muted-foreground/20'
                          }`}
                          aria-label={`Question ${i + 1}${i < visionQuestionIdx ? ' (répondue)' : i === visionQuestionIdx ? ' (en cours)' : ''}`}
                        />
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {!visionSummary ? (
                        <motion.div
                          key={visionQuestionIdx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          {VISION_QUESTIONS.map((q) => {
                            if (q.key !== VISION_QUESTIONS[visionQuestionIdx]?.key) return null
                            return (
                              <div key={q.key} className="space-y-3">
                                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0">
                                    {visionQuestionIdx + 1}
                                  </span>
                                  {q.question}
                                </Label>

                                {q.type === 'textarea' && (
                                  <Textarea
                                    placeholder={q.placeholder}
                                    value={visionAnswers[q.key] || ''}
                                    onChange={(e) => handleVisionAnswer(q.key, e.target.value)}
                                    rows={4}
                                    className="resize-none text-base"
                                    aria-describedby={`question-${q.key}-help`}
                                  />
                                )}

                                {q.type === 'chips' && (
                                  <div className="space-y-3">
                                    {q.placeholder && (
                                      <Input
                                        placeholder={q.placeholder}
                                        value={visionAnswers[q.key] || ''}
                                        onChange={(e) => handleVisionAnswer(q.key, e.target.value)}
                                        className="mb-2"
                                      />
                                    )}
                                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.question}>
                                      {q.options?.map((opt) => {
                                        const isSelected = visionAnswers[q.key] === opt
                                        return (
                                          <button
                                            key={opt}
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() => handleVisionAnswer(q.key, isSelected ? '' : opt)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border
                                              ${isSelected
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                : 'bg-background text-foreground border-muted-foreground/20 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                              }
                                            `}
                                          >
                                            {opt}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                <p id={`question-${q.key}-help`} className="text-xs text-muted-foreground">
                                  {visionQuestionIdx < VISION_QUESTIONS.length - 1
                                    ? 'Appuyez sur Entrée ou cliquez Suivant pour continuer.'
                                    : 'Soumettez vos réponses pour obtenir l\'analyse IA.'}
                                </p>
                              </div>
                            )
                          })}

                          {/* AI suggestion */}
                          <div className="space-y-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAiSuggestion}
                              disabled={aiSuggestionLoading}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            >
                              {aiSuggestionLoading ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Lightbulb className="w-4 h-4 mr-1" />
                              )}
                              Suggestion IA
                            </Button>
                            {aiSuggestion && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3 text-sm text-violet-800 dark:text-violet-200"
                              >
                                {aiSuggestion}
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        /* ---- VISION SUMMARY ---- */
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-semibold text-lg text-foreground">Résumé de votre vision</h3>
                          </div>

                          {VISION_QUESTIONS.map((q) => (
                            <div key={q.key} className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{q.question}</p>
                              <p className="text-foreground font-medium">
                                {visionAnswers[q.key] || <span className="italic text-muted-foreground">Non renseigné</span>}
                              </p>
                            </div>
                          ))}

                          {visionInsights.length > 0 && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/20 dark:to-emerald-950/20 rounded-xl border border-violet-200 dark:border-violet-800">
                              <div className="flex items-center gap-2 mb-3">
                                <Brain className="w-5 h-5 text-violet-600" />
                                <h4 className="font-semibold text-violet-900 dark:text-violet-200">Insights IA</h4>
                              </div>
                              {visionInsights.map((insight, i) => (
                                <div key={i} className="mb-3 last:mb-0">
                                  <p className="text-sm font-medium text-violet-800 dark:text-violet-300">{insight.title}</p>
                                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVisionSummary(false)}
                            className="mt-2"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Modifier mes réponses
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              )}

              {/* ============ STEP 3: RADAR ============ */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600" />
                      <CardTitle className="text-xl">Radar des Talents — Le Jeu de Corrélation</CardTitle>
                    </div>
                    <CardDescription>
                      Swipez les cartes pour identifier vos aspirations de compétences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!swipeFinished && currentCard ? (
                      <div className="flex flex-col items-center">
                        {/* Progress */}
                        <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground w-full">
                          <span>
                            Carte {swipeIndex + 1}/{swipeCards.length}
                          </span>
                          <div className="flex-1">
                            <Progress value={((swipeIndex + 1) / swipeCards.length) * 100} className="h-1.5" />
                          </div>
                          <span className="text-emerald-600 font-medium">{swipeResults.kept} gardées</span>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="text-red-500 font-medium">{swipeResults.passed} passées</span>
                        </div>

                        {/* Category badge */}
                        <Badge
                          variant="outline"
                          className={`mb-4 ${
                            currentCard.category === 'Pépites'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : currentCard.category === 'Appétences'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-violet-50 text-violet-700 border-violet-200'
                          }`}
                        >
                          {currentCard.category === 'Pépites' && <Star className="w-3 h-3 mr-1" />}
                          {currentCard.category === 'Appétences' && <Target className="w-3 h-3 mr-1" />}
                          {currentCard.category === 'Compétences' && <Zap className="w-3 h-3 mr-1" />}
                          {currentCard.category}
                        </Badge>

                        {/* Card stack */}
                        <div className="relative w-full max-w-sm h-80" role="group" aria-label="Carte de compétence à évaluer">
                          <AnimatePresence mode="popLayout">
                            <motion.div
                              key={currentCard.id}
                              drag="x"
                              dragConstraints={{ left: 0, right: 0 }}
                              style={{ x, rotate, touchAction: 'none' }}
                              onDragEnd={handleDragEnd}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{
                                scale: exitDirection ? (exitDirection === 'right' ? 1.1 : 0.9) : 1,
                                opacity: exitDirection ? 0 : 1,
                                x: exitDirection ? (exitDirection === 'right' ? 300 : -300) : 0,
                                rotate: exitDirection ? (exitDirection === 'right' ? 20 : -20) : 0,
                              }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
                              whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                              className="absolute inset-0 rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowRight') handleSwipe('right')
                                if (e.key === 'ArrowLeft') handleSwipe('left')
                              }}
                              role="region"
                              aria-label={`${currentCard.title} : ${currentCard.description}. Flèche droite pour garder, flèche gauche pour passer.`}
                            >
                              <div className={`h-full bg-gradient-to-br ${currentCard.gradient} p-6 flex flex-col justify-between relative`}>
                                {/* Swipe overlays */}
                                <motion.div
                                  style={{ opacity: likeOpacity }}
                                  className="absolute top-6 right-6 bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold text-lg rotate-12 border-2 border-emerald-600 shadow-lg pointer-events-none"
                                >
                                  PÉPITE ✓
                                </motion.div>
                                <motion.div
                                  style={{ opacity: nopeOpacity }}
                                  className="absolute top-6 left-6 bg-red-500 text-white px-4 py-1.5 rounded-lg font-bold text-lg -rotate-12 border-2 border-red-600 shadow-lg pointer-events-none"
                                >
                                  PASS ✗
                                </motion.div>

                                <div className="flex-1 flex flex-col items-center justify-center text-white">
                                  <span className="text-6xl mb-4" aria-hidden="true">{currentCard.icon}</span>
                                  <h3 className="text-2xl font-bold mb-3">{currentCard.title}</h3>
                                  <p className="text-white/90 text-sm text-center leading-relaxed max-w-xs">
                                    {currentCard.description}
                                  </p>
                                </div>

                                <p className="text-center text-white/70 text-xs">
                                  Glissez à droite pour garder, à gauche pour passer
                                </p>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-4 mt-6">
                          <Button
                            onClick={() => handleSwipe('left')}
                            variant="outline"
                            size="lg"
                            className="rounded-full w-14 h-14 p-0 border-red-200 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/30"
                            aria-label="Passer cette compétence"
                          >
                            <ThumbsDown className="w-5 h-5 text-red-500" />
                          </Button>
                          <Button
                            onClick={() => handleSwipe('right')}
                            size="lg"
                            className="rounded-full w-14 h-14 p-0 bg-emerald-600 hover:bg-emerald-700"
                            aria-label="Garder cette compétence"
                          >
                            <ThumbsUp className="w-5 h-5 text-white" />
                          </Button>
                        </div>

                        {/* Mini Kiviat preview */}
                        {kiviatAspirations.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-6 flex justify-center"
                          >
                            <InlineKiviatChart
                              acquis={kiviatAcquis}
                              aspirations={kiviatAspirations}
                              size={140}
                            />
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      /* Swipe finished or empty */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-8"
                      >
                        {swipeResults.total === 0 ? (
                          <>
                            <Target className="w-12 h-12 text-emerald-500 mb-4" />
                            <h3 className="text-lg font-bold text-foreground mb-2">Prêt à jouer ?</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                              Évaluez des compétences en les swipeant pour révéler votre profil de talents aspirés.
                            </p>
                            <Button onClick={() => setSwipeIndex(0)} className="bg-emerald-600 hover:bg-emerald-700">
                              <Zap className="w-4 h-4 mr-2" />
                              Commencer le Radar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Trophy className="w-12 h-12 text-emerald-500 mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">Radar terminé !</h3>
                            <p className="text-muted-foreground mb-6 text-center">
                              Vous avez gardé{' '}
                              <span className="font-semibold text-emerald-600">{swipeResults.kept}</span>{' '}
                              compétences sur{' '}
                              <span className="font-semibold">{swipeResults.total}</span> évaluées.
                            </p>

                            {/* Quick stats */}
                            <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-6">
                              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                                <p className="text-2xl font-bold text-emerald-600">{swipeResults.kept}</p>
                                <p className="text-xs text-muted-foreground">Pépites</p>
                              </div>
                              <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
                                <p className="text-2xl font-bold text-red-500">{swipeResults.passed}</p>
                                <p className="text-xs text-muted-foreground">Passées</p>
                              </div>
                              <div className="text-center p-3 bg-muted/50 rounded-xl">
                                <p className="text-2xl font-bold text-foreground">{swipeResults.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSwipeIndex(0)
                                setSwipeResults({ kept: 0, passed: 0, total: 0 })
                                setSwipeFinished(false)
                              }}
                              className="mb-4"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Recommencer
                            </Button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            /* ============ RESULTS PAGE ============ */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Kiviat section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-600" />
                    <CardTitle className="text-xl">Profil Compétences</CardTitle>
                  </div>
                  <CardDescription>
                    Comparaison entre vos acquis (CV) et vos aspirations (Radar).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <InlineKiviatChart
                      acquis={kiviatAcquis}
                      aspirations={kiviatAspirations}
                      size={260}
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium">Acquis (CV)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-violet-500" />
                        <span className="text-sm font-medium">Aspirations (Radar)</span>
                      </div>
                      <Separator className="my-3" />

                      {/* Dimension details */}
                      {kiviatAcquis.length > 0 && kiviatAcquis.map((dim, i) => {
                        const asp = kiviatAspirations[i]
                        return (
                          <div key={i} className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">{dim.label}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-emerald-500 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${dim.value}%` }}
                                  transition={{ duration: 1, delay: i * 0.1 }}
                                />
                              </div>
                              <span className="text-xs w-8 text-right text-emerald-600 font-medium">{dim.value}</span>
                              {asp && (
                                <>
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-violet-500 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${asp.value}%` }}
                                      transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                                    />
                                  </div>
                                  <span className="text-xs w-8 text-right text-violet-600 font-medium">{asp.value}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {kiviatAcquis.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          Complétez les étapes CV et Radar pour voir votre profil.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bilan section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-600" />
                    <CardTitle className="text-xl">Bilan IA</CardTitle>
                  </div>
                  <CardDescription>
                    Générez une analyse complète de votre profil créateur.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!bilan ? (
                    <div className="text-center py-6 space-y-4">
                      <p className="text-muted-foreground">
                        Lancez l&apos;analyse IA pour obtenir votre bilan personnalisé avec un score de viabilité.
                      </p>
                      <Button
                        onClick={handleGenerateBilan}
                        disabled={bilanLoading}
                        size="lg"
                        className="bg-gradient-to-r from-emerald-600 to-violet-600 hover:from-emerald-700 hover:to-violet-700 text-white"
                      >
                        {bilanLoading ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Rocket className="w-5 h-5 mr-2" />
                        )}
                        Générer mon Bilan IA
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Viability score */}
                      <div className="flex justify-center">
                        <ViabilityGauge score={bilan.viabilityScore} />
                      </div>

                      {/* Bilan sections */}
                      {bilan.sections.map((section, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.15 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              section.type === 'profile' ? 'bg-emerald-500' :
                              section.type === 'skills' ? 'bg-violet-500' :
                              section.type === 'gaps' ? 'bg-amber-500' :
                              section.type === 'recommendations' ? 'bg-sky-500' :
                              section.type === 'action_plan' ? 'bg-rose-500' :
                              'bg-muted'
                            }`} />
                            <h4 className="font-semibold text-foreground">{section.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-4">
                            {section.content}
                          </p>
                        </motion.div>
                      ))}

                      {/* Export */}
                      <Separator />
                      <div className="flex justify-center">
                        <Button variant="outline" onClick={handleExportPdf}>
                          <Download className="w-4 h-4 mr-2" />
                          Exporter le bilan
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edit buttons */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Modifier une étape</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowResults(false); goToStep(1) }}
                      className="w-full"
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      CV Live
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowResults(false); goToStep(2) }}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Vision
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowResults(false); goToStep(3) }}
                      className="w-full"
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Radar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- NAVIGATION FOOTER ---- */}
      {!showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between pt-2"
          role="navigation"
          aria-label="Navigation entre les étapes"
        >
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 2 && visionQuestionIdx > 0) {
                handleVisionBack()
              } else if (currentStep > 1) {
                goToStep(currentStep - 1)
              }
            }}
            disabled={
              currentStep === 1 || (currentStep === 2 && visionQuestionIdx <= 0)
            }
            aria-label="Étape précédente"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`transition-colors ${i + 1 === currentStep ? 'text-emerald-600 font-semibold' : ''}`}
              >
                {s.label}
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 inline mx-0.5 text-muted-foreground/40" />}
              </span>
            ))}
          </div>

          <Button
            onClick={() => {
              if (currentStep === 2) {
                if (!visionSummary) {
                  handleVisionNext()
                } else {
                  updateSession({ currentStep: 3, visionAnswers })
                  goToStep(3)
                }
              } else if (currentStep === 3 && swipeFinished) {
                handleFinishRadar()
              } else if (currentStep === 1 && cvData) {
                updateSession({ currentStep: 2 })
                goToStep(2)
              } else if (currentStep < 3) {
                updateSession({ currentStep: currentStep + 1 })
                goToStep(currentStep + 1)
              }
            }}
            disabled={
              (currentStep === 1 && !cvData) ||
              (currentStep === 2 && visionLoading && !visionSummary) ||
              (currentStep === 3 && !swipeFinished && swipeResults.total > 0)
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            aria-label={
              currentStep === 3 && swipeFinished
                ? 'Voir les résultats'
                : 'Étape suivante'
            }
          >
            {currentStep === 3 && swipeFinished ? (
              <>
                Voir les résultats
                <Trophy className="w-4 h-4 ml-2" />
              </>
            ) : currentStep === 2 && !visionSummary && visionQuestionIdx === VISION_QUESTIONS.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Soumettre
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
