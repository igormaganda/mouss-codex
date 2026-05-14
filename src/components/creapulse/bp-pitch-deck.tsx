'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import {
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Target,
  Users,
  DollarSign,
  Rocket,
  Shield,
  Trophy,
  HandCoins,
  Eye,
  EyeOff,
  Presentation,
  Building2,
  Megaphone,
  Clock,
  ArrowRight,
} from 'lucide-react'

// ====================== TYPES ======================
interface FormData {
  projectName: string
  sector: string
  description: string
  targetMarket: string
  currentStage: string
  teamSize: string
}

interface SlideData {
  type: string
  title: string
  subtitle?: string
  tagline?: string
  bullets?: string[]
  highlightedStat?: string
  statDescription?: string
  points?: string[]
  differentiator?: string
  tam?: string
  sam?: string
  som?: string
  tamLabel?: string
  samLabel?: string
  somLabel?: string
  features?: { title: string; description: string; status?: string }[]
  revenueSources?: string[]
  pricing?: string
  unitEconomics?: { label: string; value: string }[]
  metrics?: { label: string; value: string; trend?: string }[]
  milestones?: { date: string; event: string }[]
  advantages?: { title: string; description: string }[]
  moat?: string
  teamMembers?: { name: string; role: string; background?: string }[]
  hiringNeeds?: string[]
  askAmount?: string
  useOfFunds?: { category: string; percentage: number }[]
  notes?: string
}

interface ApiResponse {
  slides: SlideData[]
}

// ====================== CONSTANTS ======================
const STAGE_OPTIONS = [
  'Idée / Concept',
  'Validation',
  'MVP',
  'Croissance',
  'Scale-up',
]

const SECTOR_OPTIONS = [
  'Tech / SaaS',
  'E-commerce',
  'FinTech',
  'HealthTech',
  'EdTech',
  'GreenTech',
  'AgriTech',
  'Retail',
  'Services',
  'Industrie',
  'Autre',
]

const SLIDE_ICONS: Record<string, React.ElementType> = {
  title: Presentation,
  problem: AlertTriangle,
  solution: Lightbulb,
  market: BarChart3,
  product: Target,
  'business-model': DollarSign,
  traction: Trophy,
  competitive: Shield,
  team: Users,
  ask: HandCoins,
}

const SLIDE_GRADIENTS: Record<string, string> = {
  title: 'from-emerald-600 via-teal-600 to-cyan-700',
  problem: 'from-rose-500 via-red-500 to-orange-500',
  solution: 'from-amber-400 via-yellow-400 to-orange-400',
  market: 'from-sky-500 via-blue-500 to-indigo-500',
  product: 'from-violet-500 via-purple-500 to-fuchsia-500',
  'business-model': 'from-emerald-500 via-green-500 to-teal-500',
  traction: 'from-orange-500 via-amber-500 to-yellow-500',
  competitive: 'from-slate-600 via-gray-600 to-zinc-600',
  team: 'from-cyan-500 via-teal-500 to-emerald-500',
  ask: 'from-emerald-500 via-teal-500 to-cyan-500',
}

const SLIDE_ACCENT_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  title: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
  problem: { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200', light: 'bg-rose-50' },
  solution: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' },
  market: { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-200', light: 'bg-sky-50' },
  product: { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-200', light: 'bg-violet-50' },
  'business-model': { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
  traction: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200', light: 'bg-orange-50' },
  competitive: { bg: 'bg-slate-500', text: 'text-slate-600', border: 'border-slate-200', light: 'bg-slate-50' },
  team: { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-200', light: 'bg-cyan-50' },
  ask: { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-200', light: 'bg-teal-50' },
}

const SLIDE_LABELS: Record<string, string> = {
  title: 'Titre',
  problem: 'Problème',
  solution: 'Solution',
  market: 'Marché',
  product: 'Produit',
  'business-model': 'Business Model',
  traction: 'Traction',
  competitive: 'Compétitivité',
  team: 'Équipe',
  ask: 'Levée de fonds',
}

const INITIAL_FORM: FormData = {
  projectName: '',
  sector: '',
  description: '',
  targetMarket: '',
  currentStage: '',
  teamSize: '',
}

// ====================== SLIDE RENDERERS ======================

function TitleSlide({ slide }: { slide: SlideData }) {
  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${SLIDE_GRADIENTS.title} flex flex-col items-center justify-center p-8 sm:p-12 text-white overflow-hidden`}>
      {/* Decorative circles */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute bottom-[-15%] left-[-5%] w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-[20%] left-[10%] w-20 h-20 rounded-full bg-white/10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm mb-6">
          <Rocket className="w-4 h-4" />
          <span className="text-sm font-medium">{slide.subtitle || 'Pitch Deck'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
          {slide.title}
        </h1>
        {slide.tagline && (
          <p className="text-lg sm:text-xl md:text-2xl font-light opacity-90 leading-relaxed">
            {slide.tagline}
          </p>
        )}
        <div className="mt-8 flex items-center justify-center gap-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40" />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function ProblemSlide({ slide }: { slide: SlideData }) {
  const accent = SLIDE_ACCENT_COLORS.problem
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl ${accent.light} flex items-center justify-center`}>
          <AlertTriangle className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slide 2</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{slide.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* Bullet points */}
        <div className="space-y-3">
          {slide.bullets?.map((bullet, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className={`w-6 h-6 rounded-full ${accent.light} flex items-center justify-center shrink-0 mt-0.5`}>
                <span className={`text-xs font-bold ${accent.text}`}>{i + 1}</span>
              </div>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{bullet}</p>
            </motion.div>
          ))}
        </div>

        {/* Highlighted stat */}
        {slide.highlightedStat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={`mt-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border ${accent.border}`}
          >
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-600">{slide.highlightedStat}</p>
            {slide.statDescription && (
              <p className="text-sm text-slate-500 mt-1">{slide.statDescription}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function SolutionSlide({ slide }: { slide: SlideData }) {
  const accent = SLIDE_ACCENT_COLORS.solution
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl ${accent.light} flex items-center justify-center`}>
          <Lightbulb className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slide 3</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{slide.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        {/* Points */}
        <div className="space-y-3">
          {slide.points?.map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 transition-colors"
            >
              <ArrowRight className={`w-4 h-4 ${accent.text} shrink-0 mt-0.5`} />
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{point}</p>
            </motion.div>
          ))}
        </div>

        {/* Differentiator */}
        {slide.differentiator && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200"
          >
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Différenciateur clé</span>
            </div>
            <p className="text-sm sm:text-base text-amber-900 font-medium">{slide.differentiator}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function MarketSlide({ slide }: { slide: SlideData }) {
  const accent = SLIDE_ACCENT_COLORS.market
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${accent.light} flex items-center justify-center`}>
          <BarChart3 className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slide 4</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{slide.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* Concentric rectangles - TAM/SAM/SOM */}
        <div className="flex flex-col items-center gap-3">
          {/* TAM */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg p-4 sm:p-6 rounded-2xl bg-sky-50 border-2 border-sky-200"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">TAM</span>
              <span className="text-xs text-sky-500">{slide.tamLabel || 'Marché total'}</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-sky-700">{slide.tam || '—'}</p>

            {/* SAM */}
            <div className="mt-3 p-3 sm:p-4 rounded-xl bg-sky-100/60 border border-sky-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">SAM</span>
                <span className="text-xs text-blue-500">{slide.samLabel || 'Marché adressable'}</span>
              </div>
              <p className="text-base sm:text-xl font-bold text-blue-700">{slide.sam || '—'}</p>

              {/* SOM */}
              <div className="mt-3 p-3 sm:p-4 rounded-xl bg-white border border-indigo-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">SOM</span>
                  <span className="text-xs text-indigo-500">{slide.somLabel || 'Marché objectif'}</span>
                </div>
                <p className="text-base sm:text-xl font-bold text-indigo-700">{slide.som || '—'}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Visual bar breakdown */}
        <div className="mt-4 w-full max-w-lg mx-auto space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-12 shrink-0">TAM</span>
            <div className="flex-1 h-5 bg-sky-100 rounded-full overflow-hidden">
              <div className="h-full bg-sky-400 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-12 shrink-0">SAM</span>
            <div className="flex-1 h-5 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: '60%' }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-12 shrink-0">SOM</span>
            <div className="flex-1 h-5 bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full" style={{ width: '25%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductSlide({ slide }: { slide: SlideData }) {
  const accent = SLIDE_ACCENT_COLORS.product
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${accent.light} flex items-center justify-center`}>
          <Target className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slide 5</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{slide.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {slide.features?.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 sm:p-4 rounded-xl border border-slate-100 hover:border-violet-200 bg-slate-50/50 hover:bg-violet-50/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded-lg ${accent.light} flex items-center justify-center`}>
                  <span className={`text-xs font-bold ${accent.text}`}>{i + 1}</span>
                </div>
                {feature.status && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 ${
                      feature.status === 'Actif' || feature.status === 'Launché'
                        ? 'bg-emerald-100 text-emerald-700'
                        : feature.status === 'En cours'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {feature.status}
                  </Badge>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-1">{feature.title}</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed line-clamp-3">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BusinessModelSlide({ slide }: { slide: SlideData }) {
  const accent = SLIDE_ACCENT_COLORS['business-model']
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${accent.light} flex items-center justify-center`}>
          <DollarSign className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slide 6</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{slide.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Revenue Sources */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Revenus</span>
            </div>
            <ul className="space-y-1.5">
              {slide.revenueSources?.map((src, i) => (
                <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-emerald-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {src}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-teal-50 border border-teal-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Tarification</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-teal-800">{slide.pricing || '—'}</p>
          </motion.div>

          {/* Unit Economics */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-cyan-50 border border-cyan-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-cyan-600" />
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Économie unitaire</span>
            </div>
            <div className="space-y-2">
              {slide.unitEconomics?.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-cyan-600">{item.label}</span>
                  <span className="text-xs sm:text-sm font-bold text-cyan-800">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function TractionSlide({ slide }: { slide: SlideData }) {
  const accent = SLIDE_ACCENT_COLORS.traction
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${accent.light} flex items-center justify-center`}>
          <Trophy className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slide 7</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{slide.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {slide.metrics?.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center"
            >
              <p className="text-lg sm:text-2xl font-bold text-slate-800">{metric.value}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{metric.label}</p>
              {metric.trend && (
                <span className={`text-[10px] font-medium ${metric.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                  {metric.trend}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Milestone Timeline */}
        <div className="mt-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Jalons clés</p>
          <div className="relative space-y-0">
            <div className="absolute left-3 top-3 bottom-3 w-px bg-slate-200" />
            {slide.milestones?.map((ms, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative flex items-center gap-3 py-1.5"
              >
                <div className={`w-6 h-6 rounded-full ${accent.light} border-2 ${accent.border} flex items-center justify-center shrink-0 z-10 bg-white`}>
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-400 shrink-0 w-16">{ms.date}</span>
                  <span className="text-xs sm:text-sm text-slate-700 truncate">{ms.event}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CompetitiveSlide({ slide }: { slide: SlideData }) {
  const accent = SLIDE_ACCENT_COLORS.competitive
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${accent.light} flex items-center justify-center`}>
          <Shield className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slide 8</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{slide.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {/* Advantage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slide.advantages?.map((adv, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-md ${accent.bg} flex items-center justify-center`}>
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-800">{adv.title}</h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">{adv.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Moat */}
        {slide.moat && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Fossé défensif</span>
            </div>
            <p className="text-sm sm:text-base text-slate-700 font-medium">{slide.moat}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function TeamSlide({ slide }: { slide: SlideData }) {
  const accent = SLIDE_ACCENT_COLORS.team
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${accent.light} flex items-center justify-center`}>
          <Users className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slide 9</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{slide.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {/* Team Member Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {slide.teamMembers?.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 sm:p-4 rounded-xl bg-cyan-50/50 border border-cyan-100 text-center"
            >
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 bg-gradient-to-br ${SLIDE_GRADIENTS.team} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{member.name}</h3>
              <p className="text-[10px] sm:text-xs text-cyan-600 font-medium">{member.role}</p>
              {member.background && (
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{member.background}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Hiring Needs */}
        {slide.hiringNeeds && slide.hiringNeeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-1"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Postes à pourvoir</p>
            <div className="flex flex-wrap gap-2">
              {slide.hiringNeeds.map((need, i) => (
                <Badge key={i} variant="secondary" className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <Users className="w-3 h-3 mr-1" />
                  {need}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function AskSlide({ slide }: { slide: SlideData }) {
  const accent = SLIDE_ACCENT_COLORS.ask
  return (
    <div className="w-full h-full bg-white flex flex-col p-6 sm:p-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${accent.light} flex items-center justify-center`}>
          <HandCoins className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slide 10</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{slide.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        {/* Investment Amount */}
        {slide.askAmount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-5 sm:p-8 rounded-2xl bg-gradient-to-r ${SLIDE_GRADIENTS.ask} text-white text-center`}
          >
            <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Levée de fonds</p>
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold">{slide.askAmount}</p>
          </motion.div>
        )}

        {/* Use of Funds */}
        {slide.useOfFunds && slide.useOfFunds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Utilisation des fonds</p>
            <div className="space-y-3">
              {slide.useOfFunds.map((fund, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm text-slate-600 w-24 sm:w-32 shrink-0 text-right">{fund.category}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fund.percentage}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        i === 0 ? 'bg-teal-400' : i === 1 ? 'bg-emerald-400' : i === 2 ? 'bg-cyan-400' : 'bg-teal-300'
                      }`}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 w-10">{fund.percentage}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ====================== SLIDE ROUTER ======================

function SlideRenderer({ slide, slideIndex }: { slide: SlideData; slideIndex: number }) {
  const key = `${slide.type}-${slideIndex}`

  switch (slide.type) {
    case 'title':
      return <TitleSlide slide={slide} key={key} />
    case 'problem':
      return <ProblemSlide slide={slide} key={key} />
    case 'solution':
      return <SolutionSlide slide={slide} key={key} />
    case 'market':
      return <MarketSlide slide={slide} key={key} />
    case 'product':
      return <ProductSlide slide={slide} key={key} />
    case 'business-model':
      return <BusinessModelSlide slide={slide} key={key} />
    case 'traction':
      return <TractionSlide slide={slide} key={key} />
    case 'competitive':
      return <CompetitiveSlide slide={slide} key={key} />
    case 'team':
      return <TeamSlide slide={slide} key={key} />
    case 'ask':
      return <AskSlide slide={slide} key={key} />
    default:
      return (
        <div key={key} className="w-full h-full bg-white flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">{slide.title}</p>
            {slide.subtitle && <p className="text-sm text-slate-500 mt-1">{slide.subtitle}</p>}
            {slide.bullets && (
              <ul className="mt-4 space-y-2 text-sm text-slate-600 text-left max-w-md mx-auto">
                {slide.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )
  }
}

// ====================== FORM COMPONENT ======================

function GeneratorForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: FormData) => void
  isLoading: boolean
}) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-200">
          <Presentation className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Pitch Deck Pro</h1>
        <p className="text-sm text-slate-500 mt-1">Générez un pitch deck professionnel en quelques clics</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Nom du projet *</Label>
            <Input
              placeholder="Mon Startup"
              value={form.projectName}
              onChange={(e) => updateField('projectName', e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Secteur *</Label>
            <select
              value={form.sector}
              onChange={(e) => updateField('sector', e.target.value)}
              required
              className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Sélectionner...</option>
              {SECTOR_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Description du projet *</Label>
          <Textarea
            placeholder="Décrivez votre projet en quelques phrases..."
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            required
            className="rounded-xl min-h-[80px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Marché cible *</Label>
            <Input
              placeholder="PME, B2B..."
              value={form.targetMarket}
              onChange={(e) => updateField('targetMarket', e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Stade actuel *</Label>
            <select
              value={form.currentStage}
              onChange={(e) => updateField('currentStage', e.target.value)}
              required
              className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Sélectionner...</option>
              {STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Taille de l&apos;équipe</Label>
            <Input
              placeholder="3"
              type="number"
              min={1}
              value={form.teamSize}
              onChange={(e) => updateField('teamSize', e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 transition-all text-sm font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer le Pitch Deck
            </>
          )}
        </Button>
      </form>
    </motion.div>
  )
}

// ====================== PRESENTATION VIEW ======================

function PresentationView({ slides }: { slides: SlideData[] }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showNotes, setShowNotes] = useState(false)

  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1))
  }, [])

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
  }, [slides.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrev, goToNext])

  const slide = slides[currentSlide]
  const SlideIcon = SLIDE_ICONS[slide.type] || Presentation
  const slideLabel = SLIDE_LABELS[slide.type] || slide.type

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-4"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <SlideIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">{slideLabel}</span>
          </div>
          <span className="text-xs text-slate-400">
            Slide {currentSlide + 1} / {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className={`h-8 text-xs gap-1.5 rounded-lg ${showNotes ? 'bg-slate-100 text-slate-700' : 'text-slate-400'}`}
          >
            {showNotes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Notes présentateur</span>
          </Button>
        </div>
      </div>

      {/* Slide Container */}
      <div className="relative">
        <div className="aspect-[16/9] bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <SlideRenderer slide={slide} slideIndex={currentSlide} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Prev/Next Arrows */}
        <button
          onClick={goToPrev}
          disabled={currentSlide === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md border border-slate-200 flex items-center justify-center hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
          aria-label="Diapositive précédente"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentSlide === slides.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md border border-slate-200 flex items-center justify-center hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
          aria-label="Diapositive suivante"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Dot Indicators + Progress */}
      <div className="px-1 space-y-2">
        <Progress value={((currentSlide + 1) / slides.length) * 100} className="h-1" />
        <div className="flex items-center justify-center gap-1.5">
          {slides.map((s, i) => {
            const Icon = SLIDE_ICONS[s.type] || Presentation
            const isActive = i === currentSlide
            return (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300 scale-110'
                    : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                }`}
                aria-label={`Aller à la diapositive ${i + 1}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Presenter Notes */}
      <AnimatePresence>
        {showNotes && slide.notes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes présentateur</span>
              </div>
              <p className="text-sm text-slate-600 italic leading-relaxed">{slide.notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ====================== MAIN COMPONENT ======================

export default function PitchDeckGenerator() {
  const [slides, setSlides] = useState<SlideData[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async (formData: FormData) => {
    setIsLoading(true)
    setError(null)
    setSlides(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null
      const res = await fetch('/api/business-plan/pitch-deck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || `Erreur ${res.status}`)
      }

      const data: ApiResponse = await res.json()
      if (data.slides && data.slides.length > 0) {
        setSlides(data.slides)
      } else {
        throw new Error('Aucune diapositive générée')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleBack = useCallback(() => {
    setSlides(null)
    setError(null)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-6 sm:py-10 px-4 sm:px-6">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
                <Presentation className="w-8 h-8 text-white" />
              </div>
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin absolute -top-2 -right-2" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Génération du pitch deck...</p>
              <p className="text-xs text-slate-400 mt-1">Création de vos 10 diapositives</p>
            </div>
            <div className="w-48">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 8, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-6"
        >
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* Content */}
      {slides ? (
        <div>
          {/* Back button */}
          <div className="max-w-4xl mx-auto mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 text-xs text-slate-500 hover:text-slate-700 gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Nouvelle génération
            </Button>
          </div>
          <PresentationView slides={slides} />
        </div>
      ) : (
        <GeneratorForm onSubmit={handleGenerate} isLoading={isLoading} />
      )}
    </div>
  )
}
