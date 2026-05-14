'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import KiviatChart from './kiviat-chart'
import SwipeGame from './swipe-game'
import ScaleChangePanel from './scale-change-panel'
import StrategyPanel from './strategy-panel'
import FinancingPanel from './financing-panel'
import dynamic from 'next/dynamic'

const AnnuaireActorsTab = dynamic(() => import('./annuaire-actors').then(m => ({ default: () => m.default() })), { ssr: false })
const RegistrationFormTab = dynamic(() => import('./registration-form').then(m => ({ default: () => m.default() })), { ssr: false })
const ForumDiscussionsTab = dynamic(() => import('./forum-discussions').then(m => ({ default: () => m.default() })), { ssr: false })
const MentorDirectoryTab = dynamic(() => import('./mentor-directory').then(m => ({ default: () => m.default() })), { ssr: false })
const NewsFeedTab = dynamic(() => import('./news-feed').then(m => ({ default: () => m.default() })), { ssr: false })
const PersonalizedPathTab = dynamic(() => import('./personalized-path').then(m => ({ default: () => m.default() })), { ssr: false })
const NotificationCenterTab = dynamic(() => import('./notification-center').then(m => ({ default: () => m.default() })), { ssr: false })
const OutilsBPTab = dynamic(() => import('./bp-outils').then(m => ({ default: () => m.default() })), { ssr: false })
const ParcoursCreteurTab = dynamic(() => import('./parcours-creteur').then(m => ({ default: () => m.default() })), { ssr: false })

import {
  User,
  FileSearch,
  Compass,
  Briefcase,
  LayoutDashboard,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Upload,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  Heart,
  Scale,
  Building2,
  ShoppingCart,
  Landmark,
  AlertTriangle,
  Calculator,
  Lightbulb,
  Star,
  FileBarChart,
  type LucideIcon,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// Simple skeleton component
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className || ''}`} />
}

// Helper to safely fetch JSON
async function fetchJson<T>(url: string, fallback: T | null): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return fallback
    return await res.json()
  } catch {
    return fallback
  }
}

// ====================== PROFIL TAB ======================
function ProfilTab() {
  const userId = useAppStore((s) => s.userId)
  const userName = useAppStore((s) => s.userName)
  const setProfileCompleted = useAppStore((s) => s.setProfileCompleted)
  const [loading, setLoading] = useState(!!userId)
  const [profileData, setProfileData] = useState<{
    progressPercent: number
    modulesCompleted: number
    totalModules: number
    averageScore: number
    evolution: { month: string; score: number; modulesCompleted: number }[]
    userCreatedAt: string | null
    userRole: string | null
    activity: { text: string; time: string; type: string }[]
  } | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      // Fetch user progress
      const progress = await fetchJson<{
        completedSteps: number[]
        totalSteps: number
        progressPercent: number
        badges: string[]
        kpis: { modulesCompleted: number; totalModules: number; progressPercent: number; averageScore: number }
        evolution: { month: string; score: number; modulesCompleted: number }[]
      }>(`/api/profil-createur/progress?userId=${encodeURIComponent(userId)}`, null)

      // Fetch user profile for createdAt and role
      const userRes = await fetchJson<{ user: { createdAt: string; role: string } }>(
        `/api/users/${encodeURIComponent(userId)}`, null
      )

      if (cancelled) return

      // Compute trend from last 2 months of evolution
      const evolution = progress?.evolution || []
      let trend = '—'
      if (evolution.length >= 2) {
        const last = evolution[evolution.length - 1]
        const prev = evolution[evolution.length - 2]
        if (prev.score > 0) {
          const pct = Math.round(((last.score - prev.score) / prev.score) * 100)
          trend = pct >= 0 ? `+${pct}%` : `${pct}%`
        } else if (last.score > 0) {
          trend = '+100%'
        }
      }

      // Compute active days from createdAt
      let activeDays = 0
      const createdAt = userRes?.user?.createdAt
      if (createdAt) {
        activeDays = Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      }

      // Build activity from modules
      const activity = [
        ...(progress ? [{ text: 'Progression du parcours mise à jour', time: "Aujourd'hui", type: 'success' }] : []),
        { text: `${progress?.kpis.modulesCompleted || 0} module(s) complété(s) sur ${progress?.kpis.totalModules || 0}`, time: 'Parcours', type: 'info' },
      ]

      setProfileData({
        progressPercent: progress?.kpis.progressPercent ?? 0,
        modulesCompleted: progress?.kpis.modulesCompleted ?? 0,
        totalModules: progress?.kpis.totalModules ?? 0,
        averageScore: progress?.kpis.averageScore ?? 0,
        evolution,
        userCreatedAt: createdAt || null,
        userRole: userRes?.user?.role || null,
        activity,
      })
      setProfileCompleted((progress?.completedSteps?.includes(1) || false) && (progress?.progressPercent ?? 0) > 0)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  // Compute values
  const activeDays = profileData?.userCreatedAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(profileData.userCreatedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : '—'

  const trend = (() => {
    const evolution = profileData?.evolution || []
    if (evolution.length >= 2) {
      const last = evolution[evolution.length - 1]
      const prev = evolution[evolution.length - 2]
      if (prev.score > 0) {
        const pct = Math.round(((last.score - prev.score) / prev.score) * 100)
        return pct >= 0 ? `+${pct}%` : `${pct}%`
      } else if (last.score > 0) {
        return '+100%'
      }
    }
    return '—'
  })()

  const profileStats = [
    { label: 'Jours actifs', value: String(activeDays), icon: Clock },
    { label: 'Modules complétés', value: `${profileData?.modulesCompleted ?? 0}/${profileData?.totalModules ?? 0}`, icon: Trophy },
    { label: 'Score global', value: `${profileData?.averageScore ?? 0}/100`, icon: Target },
    { label: 'Tendance', value: trend, icon: TrendingUp },
  ]

  const roleLabel = profileData?.userRole === 'counselor' ? 'Conseiller' : profileData?.userRole === 'admin' ? 'Administrateur' : 'Porteur de projet'
  const formattedDate = profileData?.userCreatedAt
    ? new Date(profileData.userCreatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const progressPercent = profileData?.progressPercent ?? 0
  const remainingModules = (profileData?.totalModules ?? 0) - (profileData?.modulesCompleted ?? 0)

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm"><CardContent className="p-6"><div className="flex items-center gap-6"><Skeleton className="w-20 h-20 rounded-full" /><div className="flex-1 space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-72" /><Skeleton className="h-2.5 w-full" /></div></div></CardContent></Card>
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div key={i} variants={fadeIn}><Card className="border-0 shadow-sm"><CardContent className="p-4 space-y-2"><Skeleton className="w-5 h-5" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" /></CardContent></Card></motion.div>
          ))}
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-2xl font-bold">
                  {userName.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl font-bold text-gray-900">{userName}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {roleLabel}{formattedDate ? ` · Inscrit(e) le ${formattedDate}` : ''}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">Progression du parcours</span>
                    <span className="text-emerald-600 font-semibold">{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2.5 bg-gray-100" />
                  <p className="text-xs text-gray-400">
                    {remainingModules > 0
                      ? `${remainingModules} module(s) restant(s) pour compléter votre diagnostic`
                      : 'Parcours complété !'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {profileStats.map((stat) => (
          <motion.div key={stat.label} variants={fadeIn}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <stat.icon className="w-5 h-5 text-emerald-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(profileData?.activity || []).length > 0 ? (
              profileData!.activity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      activity.type === 'success' ? 'bg-emerald-500' : activity.type === 'info' ? 'bg-violet-500' : 'bg-gray-300'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== BILAN TAB ======================
function BilanTab() {
  const userId = useAppStore((s) => s.userId)
  const [loading, setLoading] = useState(!!userId)
  const [kiviatData, setKiviatData] = useState<Array<{ label: string; value: number; maxValue: number }>>([])

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const results = await fetchJson<Array<{ dimension: string; value: number; maxValue: number }>>(
        `/api/modules/kiviat?userId=${encodeURIComponent(userId)}`, []
      )
      if (cancelled) return
      if (results && results.length > 0) {
        setKiviatData(results.map((r) => ({ label: r.dimension, value: r.value, maxValue: r.maxValue })))
      } else {
        setKiviatData([])
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base">Jeu des Pépites</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">Découvrez vos soft skills en glissant les cartes.</p>
          </CardHeader>
          <CardContent><SwipeGame /></CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Diagramme de Kiviat</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">Visualisation de vos compétences entrepreneuriales sur 6 dimensions.</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {loading ? (
              <div className="flex flex-col items-center py-12 space-y-4">
                <Skeleton className="w-64 h-64 rounded-full" />
                <p className="text-sm text-gray-400">Chargement des données...</p>
              </div>
            ) : kiviatData.length > 0 ? (
              <>
                <KiviatChart data={kiviatData} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 w-full max-w-md">
                  {kiviatData.map((d) => (
                    <div key={d.label} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-600">{d.label}</span>
                      <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">{d.value}/{d.maxValue}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <FileSearch className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Aucune donnée Kiviat disponible.</p>
                <p className="text-xs text-gray-400 mt-1">Complétez le Jeu des Pépites pour générer votre diagramme.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== RIASEC TAB ======================
const RIASEC_META: Record<string, { title: string; color: string; barColor: string; description: string }> = {
  R: { title: 'Réaliste', color: 'bg-amber-100 text-amber-700 border-amber-200', barColor: 'bg-amber-500', description: 'Préfère les activités concrètes et manuelles.' },
  I: { title: 'Investigateur', color: 'bg-blue-100 text-blue-700 border-blue-200', barColor: 'bg-blue-500', description: "Attiré par la recherche, l'analyse et l'observation." },
  A: { title: 'Artistique', color: 'bg-rose-100 text-rose-700 border-rose-200', barColor: 'bg-rose-500', description: "Créatif et imaginatif. Valorise l'originalité." },
  S: { title: 'Social', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', barColor: 'bg-emerald-500', description: "Centré sur l'humain et les relations." },
  E: { title: 'Entrepreneurial', color: 'bg-violet-100 text-violet-700 border-violet-200', barColor: 'bg-violet-500', description: 'Persuasif avec un leadership naturel.' },
  C: { title: 'Conventionnel', color: 'bg-sky-100 text-sky-700 border-sky-200', barColor: 'bg-sky-500', description: 'Organisé et méthodique.' },
}

function RiasecTab() {
  const userId = useAppStore((s) => s.userId)
  const [loading, setLoading] = useState(!!userId)
  const [riasecProfiles, setRiasecProfiles] = useState<Array<{
    type: string; title: string; color: string; barColor: string; progress: number; description: string
  }>>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      // Fetch RIASEC results
      const riasecRes = await fetchJson<Array<{ profileType: string; score: number; isDominant: boolean }>>(
        `/api/modules/riasec?userId=${encodeURIComponent(userId)}`, []
      )

      // Fetch keyword selections
      const keywordsRes = await fetchJson<Array<{ keyword: string; selected: boolean }>>(
        `/api/modules/keywords?userId=${encodeURIComponent(userId)}`, []
      )

      if (cancelled) return

      if (riasecRes && riasecRes.length > 0) {
        setRiasecProfiles(riasecRes.map((r) => ({
          type: r.profileType,
          title: RIASEC_META[r.profileType]?.title || r.profileType,
          color: RIASEC_META[r.profileType]?.color || 'bg-gray-100 text-gray-700 border-gray-200',
          barColor: RIASEC_META[r.profileType]?.barColor || 'bg-gray-500',
          progress: r.score,
          description: RIASEC_META[r.profileType]?.description || '',
        })))
      } else {
        // Show all RIASEC profiles with 0
        setRiasecProfiles(
          Object.entries(RIASEC_META).map(([type, meta]) => ({
            type,
            title: meta.title,
            color: meta.color,
            barColor: meta.barColor,
            progress: 0,
            description: meta.description,
          }))
        )
      }

      // Set initial selected keywords from API
      const selected = (keywordsRes || []).filter((k) => k.selected).map((k) => k.keyword)
      setSelectedKeywords(selected)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const keywords = [
    'Innovation', 'Management', 'Finance', 'Marketing', 'Technologie',
    'RH', 'Écologie', 'Commerce', 'Design', 'Data', 'Handicap',
    'Social', 'International', 'Agroalimentaire', 'Santé', 'BTP',
    'Éducation', 'Culture', 'Tourisme', 'Digital',
  ]

  const toggleKeyword = useCallback((kw: string) => {
    setSelectedKeywords((prev) => {
      const next = prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
      // Persist keyword selections to API
      if (userId) {
        const selections = keywords.map((k) => ({ keyword: k, selected: next.includes(k) }))
        fetch('/api/modules/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, selections }),
        }).catch(() => {})
      }
      return next
    })
  }, [userId])

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm"><CardContent className="p-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => (<Skeleton key={i} className="h-32 rounded-xl" />))}</div></CardContent></Card>
        </motion.div>
        <motion.div variants={fadeIn}><Card className="border-0 shadow-sm"><CardContent className="p-6"><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-9 w-28 rounded-full" />))}</div></CardContent></Card></motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-violet-500" />
              <CardTitle className="text-base">Profils RIASEC</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">Découvrez votre profil dominant parmi les 6 dimensions RIASEC.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {riasecProfiles.map((profile) => (
                <motion.div key={profile.type} whileHover={{ y: -2 }} className={`p-4 rounded-xl border ${profile.color} transition-all`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{profile.type}</span>
                      <span className="text-sm font-semibold">{profile.title}</span>
                    </div>
                    <span className="text-sm font-bold">{profile.progress}%</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-2 mb-3">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${profile.progress}%` }} transition={{ duration: 0.8, delay: 0.2 }} className={`h-2 rounded-full ${profile.barColor}`} />
                  </div>
                  <p className="text-xs leading-relaxed opacity-80">{profile.description}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Loterie de mots-clés</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Sélectionnez les domaines qui vous intéressent.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => {
                const isSelected = selectedKeywords.includes(kw)
                return (
                  <motion.button key={kw} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => toggleKeyword(kw)}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                    {kw}
                  </motion.button>
                )
              })}
            </div>
            {selectedKeywords.length > 0 && (
              <p className="text-sm text-gray-500 mt-4"><span className="font-semibold text-emerald-600">{selectedKeywords.length}</span> mot(s)-clé(s) sélectionné(s)</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== MOTIVATIONS TAB ======================
function MotivationsTab() {
  const userId = useAppStore((s) => s.userId)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(!!userId)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const motivations = [
    { id: 'independence', label: "Indépendance et autonomie", description: "Être mon propre patron, gérer mon temps librement", icon: User },
    { id: 'impact', label: "Impact positif", description: "Créer de la valeur pour la société et mon territoire", icon: Heart },
    { id: 'income', label: "Revenus financiers", description: "Améliorer ma situation financière personnelle", icon: TrendingUp },
    { id: 'passion', label: "Passion et réalisation", description: "Transformer une passion en activité professionnelle", icon: Sparkles },
    { id: 'challenge', label: "Défi personnel", description: "Me dépasser, apprendre et grandir en tant qu'entrepreneur", icon: Target },
    { id: 'legacy', label: "Transmission", description: "Bâtir quelque chose de durable à transmettre", icon: Building2 },
  ]

  // Fetch existing motivations on mount
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const result = await fetchJson<{ data: Record<string, number> } | null>(
        `/api/modules/motivations?userId=${encodeURIComponent(userId)}`, null
      )
      if (cancelled) return
      if (result?.data) {
        setResponses(result.data)
      } else {
        // Start with all 0s
        const zeros: Record<string, number> = {}
        motivations.forEach((m) => { zeros[m.id] = 0 })
        setResponses(zeros)
      }
      setInitialLoaded(true)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const handleSetResponse = useCallback((id: string, value: number) => {
    setResponses((prev) => {
      const next = { ...prev, [id]: value }
      // Debounced save
      if (userId && initialLoaded) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          fetch('/api/modules/motivations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, motivations: next }),
          }).catch(() => {})
        }, 800)
      }
      return next
    })
  }, [userId, initialLoaded])

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm"><CardContent className="p-6 space-y-4">{[1, 2, 3, 4, 5, 6].map((i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}</CardContent></Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <CardTitle className="text-base">Vos motivations entrepreneuriales</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">Évaluez l'importance de chaque motivation sur une échelle de 1 à 5.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {motivations.map((m) => (
              <div key={m.id} className="p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <m.icon className="w-5 h-5 text-rose-500" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => handleSetResponse(m.id, s)}
                      className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${s <= (responses[m.id] || 0) ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== JURIDIQUE TAB ======================
interface SimulationComparison {
  id: string
  name: string
  chargesSociales: number
  resultatNet: number
  margeNette: number
  isBest: boolean
}

interface SimulationData {
 selected: {
    regime: { id: string; name: string }
    sorties: { chargesSociales: number; chargesOperatoires: number; impotEstime: number; totalCharges: number }
    resultatNet: number
    margeNette: number
    avantagesFiscaux: string[]
    recommandation: string
    alertes: string[]
  }
  comparison: SimulationComparison[]
  bestRegime: { id: string; name: string }
}

function JuridiqueTab() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>('sarl')
  const [caAnnuel, setCaAnnuel] = useState(50000)
  const [chargesReelles, setChargesReelles] = useState(10000)
  const [versementLiberatoire, setVersementLiberatoire] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null)
  const [simulationError, setSimulationError] = useState<string | null>(null)

  const statuses = [
    { id: 'auto-entrepreneur', name: 'Auto-entrepreneur', capital: 'Pas de capital minimum', charges: '~22% CA', avantages: ['Simple et rapide', 'Charges sociales réduites', 'Comptabilité simplifiée'], inconvenients: ['Plafond de CA', 'Pas de déduction des charges', 'Statut social limité'], color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'sarl', name: 'SARL / EURL', capital: '1 EUR minimum', charges: '~45% bénéfice', avantages: ['Protection du patrimoine', 'Crédibilité accrue', 'Flexibilité'], inconvenients: ['Charges sociales élevées', 'Formalités complexes', 'Rédaction statuts obligatoire'], color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'sas', name: 'SAS / SASU', capital: '1 EUR minimum', charges: '~50% rémunération', avantages: ['Grande flexibilité', 'Statut assimilé-salarié', 'Facilité de levée de fonds'], inconvenients: ['Charges sociales plus élevées', 'Formalités lourdes', 'Expert-comptable recommandé'], color: 'bg-violet-100 text-violet-700 border-violet-200' },
    { id: 'association', name: 'Association (loi 1901)', capital: 'Pas de capital', charges: 'Variable', avantages: ['But non lucratif', 'Subventions possibles', 'Agréments disponibles'], inconvenients: ['Pas de partage bénéfices', 'Gouvernance contraignante', 'Comptabilité spécifique'], color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ]

  const current = statuses.find(s => s.id === selectedStatus)

  const runSimulation = useCallback(async () => {
    if (!selectedStatus || caAnnuel <= 0) return
    setSimulating(true)
    setSimulationError(null)
    try {
      const res = await fetch('/api/juridique/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caAnnuel,
          chargesReelles,
          regimeId: selectedStatus,
          versementLiberatoire: selectedStatus === 'auto-entrepreneur' ? versementLiberatoire : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setSimulationError(err.error || 'Erreur lors de la simulation')
        return
      }
      const data = await res.json()
      setSimulationData(data)
    } catch {
      setSimulationError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSimulating(false)
    }
  }, [selectedStatus, caAnnuel, chargesReelles, versementLiberatoire])

  // Auto-trigger simulation when regime changes
  const handleStatusChange = (id: string) => {
    setSelectedStatus(id)
    setSimulationError(null)
  }

  const formatEur = (n: number) => n.toLocaleString('fr-FR') + ' EUR'

  const regimeColorMap: Record<string, string> = {
    'auto-entrepreneur': 'border-emerald-400 bg-emerald-50',
    'sar': 'border-blue-400 bg-blue-50',
    'sas': 'border-violet-400 bg-violet-50',
    'association': 'border-amber-400 bg-amber-50',
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Existing regime comparison card */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-base">Choix du statut juridique</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {statuses.map((s) => (
                <button key={s.id} onClick={() => handleStatusChange(s.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${selectedStatus === s.id ? s.color : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-[10px] opacity-70 mt-1">{s.capital}</p>
                </button>
              ))}
            </div>
            {current && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="font-semibold text-sm text-emerald-800 mb-2">Avantages</p>
                  <div className="space-y-1.5">{current.avantages.map((a, i) => <p key={i} className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{a}</p>)}</div>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="font-semibold text-sm text-red-800 mb-2">Points de vigilance</p>
                  <div className="space-y-1.5">{current.inconvenients.map((d, i) => <p key={i} className="text-sm text-red-700 flex items-center gap-2"><Circle className="w-3.5 h-3.5 text-red-400" />{d}</p>)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Simulation panel */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-500" />
              <CardTitle className="text-base">Simulateur de charges</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">Estimez l&apos;impact financier de chaque régime juridique selon votre activité.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">CA annuel estimé (EUR)</label>
                <Input type="number" min={0} value={caAnnuel} onChange={(e) => setCaAnnuel(Number(e.target.value))} className="rounded-xl" placeholder="ex: 50000" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Charges réelles annuelles (EUR)</label>
                <Input type="number" min={0} value={chargesReelles} onChange={(e) => setChargesReelles(Number(e.target.value))} className="rounded-xl" placeholder="ex: 10000" />
              </div>
            </div>

            {/* Versement libératoire checkbox (only for auto-entrepreneur) */}
            {selectedStatus === 'auto-entrepreneur' && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <Checkbox
                  id="versement-lib"
                  checked={versementLiberatoire}
                  onCheckedChange={(checked) => setVersementLiberatoire(checked === true)}
                />
                <label htmlFor="versement-lib" className="text-sm text-emerald-800 cursor-pointer select-none">
                  <span className="font-medium">Versement libératoire</span>
                  <span className="text-xs text-emerald-600 block">IR forfaitaire à 1,7% du CA (services)</span>
                </label>
              </div>
            )}

            {/* Simulate button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={runSimulation}
                disabled={simulating || caAnnuel <= 0 || !selectedStatus}
                className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
              >
                {simulating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                {simulating ? 'Calcul en cours...' : 'Simuler'}
              </Button>
              {selectedStatus && (
                <span className="text-xs text-gray-400">
                  Régime sélectionné : <span className="font-medium text-gray-600">{statuses.find(s => s.id === selectedStatus)?.name}</span>
                </span>
              )}
            </div>

            {/* Error */}
            {simulationError && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{simulationError}</AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {simulationData && (
              <div className="space-y-4">
                {/* Best regime banner */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-teal-50 border border-teal-200">
                  <Star className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-teal-800">
                      Régime recommandé : {simulationData.bestRegime.name}
                    </p>
                    <p className="text-xs text-teal-600 mt-0.5">
                      {simulationData.selected.recommandation}
                    </p>
                  </div>
                </div>

                {/* Alerts */}
                {simulationData.selected.alertes.length > 0 && (
                  <div className="space-y-2">
                    {simulationData.selected.alertes.map((alerte, i) => (
                      <Alert key={i} className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 text-sm">{alerte}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Comparison table - horizontal scroll on mobile */}
                <div className="overflow-x-auto -mx-1">
                  <div className="min-w-[600px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Régime</th>
                          <th className="text-right py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Charges sociales</th>
                          <th className="text-right py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Résultat net</th>
                          <th className="text-right py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Marge nette</th>
                          <th className="text-center py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationData.comparison.map((regime) => (
                          <tr
                            key={regime.id}
                            className={`border-t border-gray-100 transition-colors ${
                              regime.isBest
                                ? 'bg-teal-50/60'
                                : selectedStatus === regime.id
                                  ? 'bg-gray-50'
                                  : ''
                            }`}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  regime.id === 'auto-entrepreneur' ? 'bg-emerald-500' :
                                  regime.id === 'sar' ? 'bg-blue-500' :
                                  regime.id === 'sas' ? 'bg-violet-500' : 'bg-amber-500'
                                }`} />
                                <span className={`font-medium ${regime.isBest ? 'text-teal-800' : 'text-gray-700'}`}>{regime.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-gray-600">
                              {formatEur(regime.chargesSociales)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-gray-900">
                              {formatEur(regime.resultatNet)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`inline-flex items-center gap-1 font-semibold ${
                                regime.margeNette >= 40 ? 'text-emerald-600' :
                                regime.margeNette >= 25 ? 'text-amber-600' : 'text-red-500'
                              }`}>
                                {regime.margeNette}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {regime.isBest && (
                                <Badge className="bg-teal-100 text-teal-800 border-teal-300 text-xs font-medium">
                                  Recommandé
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recommendations */}
                {simulationData.selected.avantagesFiscaux.length > 0 && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <p className="font-semibold text-sm text-blue-800">Recommandations fiscales</p>
                    </div>
                    <div className="space-y-1.5">
                      {simulationData.selected.avantagesFiscaux.map((rec, i) => (
                        <p key={i} className="text-sm text-blue-700 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                          {rec}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected regime detail */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-xl border-2 ${regimeColorMap[simulationData.selected.regime.id] || 'border-gray-200 bg-gray-50'} text-center`}>
                    <p className="text-lg font-bold text-gray-900">{formatEur(simulationData.selected.sorties.chargesSociales)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Charges sociales</p>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-center">
                    <p className="text-lg font-bold text-gray-900">{formatEur(simulationData.selected.sorties.impotEstime)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Impôt estimé</p>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-center">
                    <p className="text-lg font-bold text-gray-900">{formatEur(simulationData.selected.sorties.totalCharges)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Total des charges</p>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 text-center">
                    <p className="text-lg font-bold text-emerald-600">{formatEur(simulationData.selected.resultatNet)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Résultat net</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== MARCHÉ TAB ======================
function MarcheTab() {
  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-violet-500" />
              <CardTitle className="text-base">Analyse de marché</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">Ajoutez vos segments de marché cibles pour votre projet.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun segment de marché défini.</p>
              <p className="text-xs text-gray-400 mt-1">Commencez par explorer la stratégie pour identifier vos marchés cibles.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== FINANCIER TAB (KPIs rapide) ======================
function FinancierTab() {
  const userId = useAppStore((s) => s.userId)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [monthlyCosts, setMonthlyCosts] = useState(0)
  const [loading, setLoading] = useState(!!userId)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch existing financial data on mount
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const result = await fetchJson<{ data: { revenue: number; costs: number } } | null>(
        `/api/modules/financier?userId=${encodeURIComponent(userId)}`, null
      )
      if (cancelled) return
      if (result?.data) {
        setMonthlyRevenue(result.data.revenue || 0)
        setMonthlyCosts(result.data.costs || 0)
      }
      setInitialLoaded(true)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  // Save to API on change (debounced)
  const handleRevenueChange = useCallback((value: number) => {
    setMonthlyRevenue(value)
    if (userId && initialLoaded) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetch('/api/modules/financier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, revenue: value, costs: monthlyCosts }),
        }).catch(() => {})
      }, 800)
    }
  }, [userId, initialLoaded, monthlyCosts])

  const handleCostsChange = useCallback((value: number) => {
    setMonthlyCosts(value)
    if (userId && initialLoaded) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetch('/api/modules/financier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, revenue: monthlyRevenue, costs: value }),
        }).catch(() => {})
      }, 800)
    }
  }, [userId, initialLoaded, monthlyRevenue])

  const profit = monthlyRevenue - monthlyCosts
  const margin = monthlyRevenue > 0 ? ((profit / monthlyRevenue) * 100).toFixed(1) : '0.0'

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm"><CardContent className="p-6 space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Skeleton className="h-10 rounded-xl" /><Skeleton className="h-10 rounded-xl" /></div><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => (<Skeleton key={i} className="h-20 rounded-xl" />))}</div></CardContent></Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Indicateurs financiers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">CA mensuel estimé (EUR)</label>
                <Input type="number" value={monthlyRevenue} onChange={(e) => handleRevenueChange(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Charges mensuelles (EUR)</label>
                <Input type="number" value={monthlyCosts} onChange={(e) => handleCostsChange(Number(e.target.value))} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <p className="text-xl font-bold text-emerald-600">{profit.toLocaleString('fr-FR')} EUR</p>
                <p className="text-xs text-gray-500">Résultat mensuel</p>
              </div>
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-center">
                <p className="text-xl font-bold text-violet-600">{margin}%</p>
                <p className="text-xs text-gray-500">Marge bénéficiaire</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-xl font-bold text-amber-600">{(profit * 12).toLocaleString('fr-FR')} EUR</p>
                <p className="text-xs text-gray-500">Résultat annuel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== COMPETENCES TAB ======================
function CompetencesTab() {
  const userId = useAppStore((s) => s.userId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; fileName?: string; fileUrl?: string; analysisId?: string; error?: string } | null>(null)
  const [analysisData, setAnalysisData] = useState<{
    id: string
    cvFileName: string | null
    cvFileUrl: string | null
    acquiredSkills: unknown
    gapSkills: unknown
    recommendedPlan: unknown
    analyzedAt: string
  } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(!!userId)

  // Fetch existing analysis on mount
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const loadAnalysis = async () => {
      setLoadingAnalysis(true)
      const res = await fetchJson<{ analysis: typeof analysisData }>(
        `/api/upload/cv?userId=${encodeURIComponent(userId)}`, { analysis: null }
      )
      if (cancelled) return
      if (res && res.analysis) {
        setAnalysisData(res.analysis)
      }
      setLoadingAnalysis(false)
    }
    loadAnalysis()
    return () => { cancelled = true }
  }, [userId])

  const handleFileSelect = (file: File) => {
    setCvFile(file)
    setUploadResult(null)
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    if (!userId) {
      setUploadResult({ success: false, error: 'Vous devez être connecté pour télécharger un CV.' })
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!allowedTypes.includes(file.type)) {
      setUploadResult({ success: false, error: 'Type de fichier non supporté. Utilisez PDF, DOC ou DOCX.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadResult({ success: false, error: 'Fichier trop volumineux. Maximum 5 Mo.' })
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)

      const res = await fetch('/api/upload/cv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setUploadResult({ success: false, error: data.error || 'Erreur lors du téléchargement.' })
        return
      }

      setUploadResult({ success: true, fileName: data.fileName, fileUrl: data.fileUrl, analysisId: data.analysisId })

      // Fetch the latest analysis
      const analysisRes = await fetch(`/api/upload/cv?userId=${encodeURIComponent(userId)}`)
      const analysisJson = await analysisRes.json()
      if (analysisJson.analysis) {
        setAnalysisData(analysisJson.analysis)
      }
    } catch {
      setUploadResult({ success: false, error: 'Erreur réseau. Veuillez réessayer.' })
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Derive career map data from analysis if available
  const acquiredSkillsArr = Array.isArray(analysisData?.acquiredSkills) ? (analysisData.acquiredSkills as string[]) : []
  const gapSkillsArr = Array.isArray(analysisData?.gapSkills) ? (analysisData.gapSkills as string[]) : []
  const recPlan = analysisData?.recommendedPlan && typeof analysisData.recommendedPlan === 'object' ? (analysisData.recommendedPlan as Record<string, unknown>) : {}

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Import du CV — Skill Gap Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleInputChange}
            />

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : uploadResult?.success
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : uploadResult?.success === false
                  ? 'border-red-300 bg-red-50/20'
                  : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Téléchargement en cours...</p>
                  <p className="text-xs text-gray-400">Analyse de votre CV par l&apos;IA</p>
                </>
              ) : uploadResult?.success ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-emerald-700 mb-1">CV téléchargé avec succès !</p>
                  <p className="text-xs text-gray-500">{uploadResult.fileName}</p>
                  <Button variant="outline" size="sm" className="mt-4 rounded-full">Remplacer le fichier</Button>
                </>
              ) : uploadResult?.success === false ? (
                <>
                  <Upload className="w-10 h-10 text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-red-600 mb-1">Erreur</p>
                  <p className="text-xs text-red-500">{uploadResult.error}</p>
                  <Button variant="outline" size="sm" className="mt-4 rounded-full">Réessayer</Button>
                </>
              ) : (
                <>
                  <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragOver ? 'text-emerald-500' : 'text-gray-300 group-hover:text-emerald-500'}`} />
                  <p className="text-sm font-medium text-gray-700 mb-1">Glissez-déposez votre CV ici</p>
                  <p className="text-xs text-gray-400">PDF, DOC, DOCX — Maximum 5 Mo</p>
                  <Button variant="outline" size="sm" className="mt-4 rounded-full">Parcourir les fichiers</Button>
                </>
              )}
            </div>

            {/* Info banner */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700">
                <Sparkles className="w-4 h-4 inline mr-1" />
                L&apos;IA analysera votre CV pour identifier vos compétences acquises, les écarts par rapport à votre projet et recommander un plan de formation personnalisé.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Career Map section */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Cartographie de compétences (Career Map)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalysis ? (
              <div className="flex flex-col items-center py-12 space-y-3">
                <Skeleton className="w-64 h-32 rounded-xl" />
                <Skeleton className="w-64 h-32 rounded-xl" />
                <Skeleton className="w-64 h-32 rounded-xl" />
              </div>
            ) : (
              <div className="flex flex-col items-center py-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-xl bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex-1 max-w-xs">
                    <p className="font-semibold text-emerald-800 text-sm">Compétences acquises</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {acquiredSkillsArr.length > 0 ? acquiredSkillsArr.join(', ') : analysisData ? 'Aucune compétence identifiée' : 'Importez un CV pour analyser vos compétences'}
                    </p>
                  </div>
                </motion.div>
                <div className="flex flex-col items-center my-2"><div className="w-0.5 h-8 bg-gray-200" /><ArrowRight className="w-5 h-5 text-gray-300 rotate-90" /><div className="w-0.5 h-8 bg-gray-200" /></div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center"><Target className="w-7 h-7 text-amber-600" /></div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex-1 max-w-xs">
                    <p className="font-semibold text-amber-800 text-sm">Écarts identifiés (Skill Gap)</p>
                    <p className="text-xs text-amber-600 mt-1">
                      {gapSkillsArr.length > 0 ? gapSkillsArr.join(', ') : analysisData ? 'Aucun écart identifié' : 'Importez un CV pour identifier les écarts'}
                    </p>
                  </div>
                </motion.div>
                <div className="flex flex-col items-center my-2"><div className="w-0.5 h-8 bg-gray-200" /><ArrowRight className="w-5 h-5 text-gray-300 rotate-90" /><div className="w-0.5 h-8 bg-gray-200" /></div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-violet-100 border-2 border-violet-400 flex items-center justify-center"><TrendingUp className="w-7 h-7 text-violet-600" /></div>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex-1 max-w-xs">
                    <p className="font-semibold text-violet-800 text-sm">Plan de développement recommandé</p>
                    <p className="text-xs text-violet-600 mt-1">
                      {Object.keys(recPlan).length > 0 ? Object.entries(recPlan).map(([k, v]) => `${k}: ${String(v)}`).join(', ') : analysisData ? 'Aucune recommandation' : 'Importez un CV pour obtenir un plan personnalisé'}
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== TABLEAU DE BORD TAB ======================
function TableauDeBordTab() {
  const userId = useAppStore((s) => s.userId)
  const [loading, setLoading] = useState(!!userId)
  const [roadmapSteps, setRoadmapSteps] = useState<Array<{
    title: string; description: string; status: 'completed' | 'in_progress' | 'upcoming' | 'blocked'; date: string
  }>>([])
  const [progressInfo, setProgressInfo] = useState<{ completed: number; total: number } | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const data = await fetchJson<{
        steps: Array<{
          id: string; order: number; title: string; description: string;
          status: 'completed' | 'in_progress' | 'upcoming' | 'blocked';
          estimatedDuration: string; completedAt?: string;
        }>
        progress: { completed: number; total: number; percent: number }
      }>(
        `/api/roadmap?userId=${encodeURIComponent(userId)}`, null
      )

      if (cancelled) return

      if (data?.steps && data.steps.length > 0) {
        setRoadmapSteps(data.steps.map((step) => ({
          title: step.title,
          description: step.description,
          status: step.status,
          date: step.completedAt
            ? new Date(step.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            : step.status === 'in_progress'
              ? 'En cours'
              : 'À venir',
        })))
        setProgressInfo({ completed: data.progress.completed, total: data.progress.total })
      } else {
        setRoadmapSteps([])
        setProgressInfo(null)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const statusIcons: Record<string, LucideIcon> = { completed: CheckCircle2, in_progress: Loader2, upcoming: Circle }
  const statusColors: Record<string, string> = { completed: 'text-emerald-500', in_progress: 'text-violet-500', upcoming: 'text-gray-300' }
  const statusBg: Record<string, string> = { completed: 'bg-emerald-50 border-emerald-200', in_progress: 'bg-violet-50 border-violet-200', upcoming: 'bg-gray-50 border-gray-200' }

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm"><CardContent className="p-6 space-y-6">{[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-20 rounded-xl" />))}</CardContent></Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Feuille de Route interactive</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Suivez votre progression dans le parcours de diagnostic.</p>
              </div>
              {progressInfo && (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                  {progressInfo.completed}/{progressInfo.total} étapes
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {roadmapSteps.length > 0 ? (
              <div className="relative">
                <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-6">
                  {roadmapSteps.map((step, i) => {
                    const StatusIcon = statusIcons[step.status]
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative flex items-start gap-4">
                        <div className="relative z-10 w-14 h-14 shrink-0 rounded-xl border flex items-center justify-center bg-white shadow-sm">
                          <StatusIcon className={`w-6 h-6 ${statusColors[step.status]} ${step.status === 'in_progress' ? 'animate-spin' : ''}`} />
                        </div>
                        <div className={`flex-1 p-4 rounded-xl border ${statusBg[step.status]} min-w-0`}>
                          <div className="flex items-start justify-between gap-2">
                            <div><p className="font-semibold text-gray-900 text-sm">{step.title}</p><p className="text-xs text-gray-500 mt-1">{step.description}</p></div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">{step.date}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <LayoutDashboard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune étape de parcours définie</p>
                <p className="text-xs text-gray-400 mt-1">Commencez par compléter les modules pour construire votre feuille de route.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== BILAN COHÉRENCE TAB ======================
function BilanCoherenceTab() {
  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Bilan de Cohérence</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">Comparez vos acquis (CV) avec vos aspirations (Radar) pour identifier votre zone de convergence.</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Complétez votre CV et le Jeu des Pépites pour générer votre Bilan de Cohérence.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== EXPORT BP TAB ======================
function ExportBPTab() {
  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileBarChart className="w-5 h-5 text-violet-500" />
              <CardTitle className="text-base">Exporter mon Business Plan</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">Générez votre Business Plan complet et votre Pitch Deck.</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileBarChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Remplissez les sections Stratégie, Marché et Financier pour débloquer l&apos;export.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== RAPPORT ECHO ENTREPRENDRE TAB ======================
function RapportEchoEntreprendreTab() {
  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-teal-500" />
              <CardTitle className="text-base">Rapport de Diagnostic Echo Entreprendre</CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">Votre bilan complet avec la feuille de route à 6 mois.</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Complétez les 5 étapes du parcours pour générer votre Rapport Echo Entreprendre.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== MAIN USER DASHBOARD ======================
// ====================== INSIGHTS IA DÉFILANT ======================
const INSIGHTS: Record<string, string[]> = {
  profil: [
    'Conseil : Complétez votre profil pour accéder aux modules de diagnostic personnalisés.',
    'Astuce : Un profil complet débloque les recommandations IA contextuelles.',
    'Votre progression est calculée automatiquement selon les modules complétés.',
  ],
  'parcours-creteur': [
    'Parcours Créateur : Définissez votre vision entrepreneuriale en 3 étapes.',
    'Identifiez vos atouts et vos zones de développement dès le premier diagnostic.',
  ],
  bilan: [
    'Jeu des Pépites : Glissez les cartes vers la droite pour garder une compétence.',
    'Le diagramme de Kiviat se met à jour automatiquement après chaque session.',
    'Astuce : Le Kiviat compare vos soft skills sur 6 dimensions clés.',
  ],
  riasec: [
    'RIASEC : 6 profils pour mieux comprendre votre orientation.',
    'Sélectionnez vos mots-clés de secteurs pour affiner les recommandations.',
  ],
  motivations: [
    'Vos motivations guideront les suggestions de l\'IA dans tout le parcours.',
    'Évaluez honnêtement : il n\'y a pas de mauvaise réponse.',
  ],
  competences: [
    'Uploadez votre CV pour lancer une analyse automatique de vos compétences.',
    'Le Skill Gap identifie les écarts entre vos acquis et les besoins entrepreneurial.',
    'Conseil : Un CV à jour améliore significativement la précision du diagnostic.',
  ],
  juridique: [
    'Simulatez vos charges pour comparer les régimes juridiques.',
    'Le simulateur recommande le statut le plus adapté à votre activité.',
  ],
  marche: [
    'L\'étude de marché est essentielle pour valider votre idée de business.',
    'Identifiez votre client cible et analysez la concurrence.',
  ],
  financier: [
    'Estimez votre CA et vos charges pour obtenir un premier seuil de rentabilité.',
    'La marge bénéficiaire guide vos décisions de prix.',
  ],
  strategie: [
    'Votre stratégie doit reposer sur une analyse de marché solide.',
    'Pensez à votre avantage concurrentiel unique.',
  ],
  financement: [
    'Plusieurs aides sont cumulables : n\'hésitez pas à explorer toutes les options.',
    'Le love money et les prêts d\'honneur sont souvent sous-estimés.',
  ],
  'changement-echelle': [
    'La croissance doit être maîtrisée pour rester viable.',
    'Anticipez les besoins de recrutement dès le début.',
  ],
  annuaire: [
    'L\'écosystème local regorge de ressources pour les créateurs.',
    'Les incubateurs offrent souvent un accompagnement gratuit.',
  ],
  inscription: [
    'Inscrivez votre projet pour accéder aux outils de modélisation.',
    'Un projet bien défini facilite les échanges avec vos conseillers.',
  ],
  forum: [
    'Échangez avec d\'autres créateurs qui partagent vos défis.',
    'Les retours du forum enrichissent votre vision entrepreneuriale.',
  ],
  mentorat: [
    'Un mentor peut accélérer votre progression de 30% en moyenne.',
    'N\'hésitez pas à solliciter un accompagnement personnalisé.',
  ],
  actualites: [
    'Restez informé des tendances et opportunités de votre secteur.',
    'La veille est un atout stratégique pour tout entrepreneur.',
  ],
  parcours: [
    'Votre progression est visible dans la feuille de route interactive.',
    'Chaque étape validée débloque la suivante.',
  ],
  'tableau-de-bord': [
    'Le tableau de bord centralise toutes vos métriques clés.',
    'Consultez-le régulièrement pour suivre votre progression.',
  ],
  outils: [
    'Les outils BP vous aident à structurer votre Business Plan.',
    'Le Canvas BMC offre une vue synthétique de votre modèle.',
  ],
}

function InsightsBar() {
  const userTab = useAppStore((s) => s.userTab)
  const [index, setIndex] = useState(0)
  const messages = INSIGHTS[userTab] || ['Explorez les différents modules pour découvrir vos atouts entrepreneuriaux.']

  useEffect(() => {
    setIndex(0)
  }, [userTab])

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [messages.length])

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/60 px-4 py-2.5">
      <div className="flex items-center gap-2 min-h-[28px]">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-800 truncate">{messages[index]}</p>
        </motion.div>
        <div className="flex gap-1 shrink-0">
          {messages.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-emerald-600 scale-125' : 'bg-emerald-300/60 hover:bg-emerald-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function UserDashboard() {
  const userTab = useAppStore((s) => s.userTab)

  const renderTab = () => {
    switch (userTab) {
      case 'profil': return <ProfilTab />
      case 'parcours-creteur': return <ParcoursCreteurTab />
      case 'bilan': return <BilanTab />
      case 'riasec': return <RiasecTab />
      case 'motivations': return <MotivationsTab />
      case 'juridique': return <JuridiqueTab />
      case 'competences': return <CompetencesTab />
      case 'marche': return <MarcheTab />
      case 'financier': return <FinancierTab />
      case 'strategie': return <StrategyPanel />
      case 'financement': return <FinancingPanel />
      case 'changement-echelle': return <ScaleChangePanel />
      case 'tableau-de-bord': return <TableauDeBordTab />
      case 'annuaire': return <AnnuaireActorsTab />
      case 'inscription': return <RegistrationFormTab />
      case 'forum': return <ForumDiscussionsTab />
      case 'mentorat': return <MentorDirectoryTab />
      case 'actualites': return <NewsFeedTab />
      case 'parcours': return <PersonalizedPathTab />
      case 'notifications': return <NotificationCenterTab />
      case 'outils': return <OutilsBPTab />
      case 'bilan-coherence': return <BilanCoherenceTab />
      case 'export-bp': return <ExportBPTab />
      case 'rapport-echo-entreprendre': return <RapportEchoEntreprendreTab />
      default: return <ProfilTab />
    }
  }

  return (
    <div className="space-y-4">
      {/* ===== INSIGHTS IA DÉFILANT ===== */}
      <InsightsBar />
      {/* ===== CONTENU DU TAB ===== */}
      {renderTab()}
    </div>
  )
}
