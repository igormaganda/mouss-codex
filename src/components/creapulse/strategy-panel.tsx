'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Target,
  TrendingUp,
  Lightbulb,
  Plus,
  Minus,
  ChevronRight,
  Star,
  Zap,
  Shield,
  Rocket,
  Globe,
  Users,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const growthLevers = [
  {
    id: 'digital',
    name: 'Transformation digitale',
    icon: Globe,
    description: 'E-commerce, réseaux sociaux, marketing digital, automatisation',
    impact: 'Fort',
    effort: 'Moyen',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-50',
  },
  {
    id: 'partnership',
    name: 'Partenariats B2B',
    icon: Users,
    description: 'Réseau de distribution, alliances stratégiques, co-branding',
    impact: 'Moyen',
    effort: 'Faible',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-50',
  },
  {
    id: 'innovation',
    name: 'Innovation produit',
    icon: Lightbulb,
    description: 'R&D, nouveaux services, différenciation concurrentielle',
    impact: 'Fort',
    effort: 'Fort',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    iconBg: 'bg-violet-50',
  },
  {
    id: 'geographic',
    name: 'Expansion géographique',
    icon: Rocket,
    description: 'Nouveaux marchés, internationalisation, franchise',
    impact: 'Fort',
    effort: 'Fort',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-50',
  },
  {
    id: 'talent',
    name: 'Acquisition de talents',
    icon: Star,
    description: 'Recrutement clé, formation, rétention des compétences',
    impact: 'Moyen',
    effort: 'Moyen',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    iconBg: 'bg-rose-50',
  },
]

interface SwotData {
  forces: string[]
  faiblesses: string[]
  opportunites: string[]
  menaces: string[]
}

const emptySwot: SwotData = {
  forces: [],
  faiblesses: [],
  opportunites: [],
  menaces: [],
}

export default function StrategyPanel() {
  const userId = useAppStore((s) => s.userId)
  const [selectedLevers, setSelectedLevers] = useState<string[]>([])
  const [offerPrice, setOfferPrice] = useState(97)
  const [offerCost, setOfferCost] = useState(32)
  const [monthlyClients, setMonthlyClients] = useState(45)
  const [swotItems, setSwotItems] = useState<SwotData>(emptySwot)
  const [newItem, setNewItem] = useState('')
  const [activeSwot, setActiveSwot] = useState<'forces' | 'faiblesses' | 'opportunites' | 'menaces'>('forces')
  const [roadmap, setRoadmap] = useState<Array<{
    phase: string
    title: string
    period: string
    tasks: string[]
    status: string
  }>>([])
  const [growthRateInput, setGrowthRateInput] = useState(10)
  const [availableCapital, setAvailableCapital] = useState(50000)
  const [isLoading, setIsLoading] = useState(!!userId)

  // Fetch strategy data on mount
  useEffect(() => {
    if (!userId) return

    const fetchStrategy = async () => {
      setIsLoading(true)
      try {
        // Fetch strategy/levers/swot data
        const res = await fetch(`/api/strategy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            growthLevers: { innovation: 5, marketing: 5, digitalPresence: 5, partnerships: 5, talentRetention: 5 },
            financialParams: { annualRevenue: 0, annualCosts: 0, growthRate: 0, availableCapital: 0 },
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.swot) {
            setSwotItems({
              forces: data.swot.strengths || [],
              faiblesses: data.swot.weaknesses || [],
              opportunites: data.swot.opportunities || [],
              menaces: data.swot.threats || [],
            })
          }
        }
      } catch {
        // Silently fail — use empty data
      }

      // Fetch roadmap
      try {
        const roadmapRes = await fetch(`/api/roadmap?userId=${userId}`)
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json()
          const steps = roadmapData.steps || []
          if (steps.length > 0) {
            // Group roadmap steps into phases for display
            const phases = [
              {
                phase: 'Phase 1',
                title: 'Fondations',
                period: 'Mois 1-3',
                tasks: steps.slice(0, 3).map((s: { title: string }) => s.title),
                status: 'completed',
              },
              {
                phase: 'Phase 2',
                title: 'Croissance',
                period: 'Mois 4-6',
                tasks: steps.slice(3, 6).map((s: { title: string }) => s.title),
                status: 'in_progress',
              },
              {
                phase: 'Phase 3',
                title: 'Expansion',
                period: 'Mois 7-12',
                tasks: steps.slice(6).map((s: { title: string }) => s.title).filter(Boolean),
                status: 'upcoming',
              },
            ].filter((p) => p.tasks.length > 0)
            setRoadmap(phases)
          }
        }
      } catch {
        // Use default template roadmap
      }

      setIsLoading(false)
    }

    fetchStrategy()
  }, [userId])

  // Save SWOT and levers on change
  const saveStrategy = async (levers: string[], swot: SwotData) => {
    if (!userId) return
    try {
      await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          growthLevers: {
            innovation: levers.includes('innovation') ? 8 : 3,
            marketing: levers.includes('digital') ? 8 : 3,
            digitalPresence: levers.includes('digital') ? 8 : 3,
            partnerships: levers.includes('partnership') ? 8 : 3,
            talentRetention: levers.includes('talent') ? 8 : 3,
          },
          financialParams: {
            annualRevenue: offerPrice * monthlyClients * 12,
            annualCosts: offerCost * monthlyClients * 12,
            growthRate: growthRateInput,
            availableCapital: availableCapital,
          },
        }),
      })
    } catch {
      // Silently fail
    }
  }

  const toggleLever = (id: string) => {
    setSelectedLevers((prev) => {
      const newLevers = prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
      // Debounced save
      setTimeout(() => saveStrategy(newLevers, swotItems), 500)
      return newLevers
    })
  }

  const addSwotItem = () => {
    if (!newItem.trim()) return
    setSwotItems((prev) => {
      const updated = {
        ...prev,
        [activeSwot]: [...prev[activeSwot], newItem.trim()],
      }
      // Debounced save
      setTimeout(() => saveStrategy(selectedLevers, updated), 500)
      return updated
    })
    setNewItem('')
  }

  const removeSwotItem = (section: keyof SwotData, index: number) => {
    setSwotItems((prev) => {
      const updated = {
        ...prev,
        [section]: prev[section].filter((_, i) => i !== index),
      }
      // Debounced save
      setTimeout(() => saveStrategy(selectedLevers, updated), 500)
      return updated
    })
  }

  // Calcul rentabilité
  const monthlyRevenue = offerPrice * monthlyClients
  const monthlyCost = offerCost * monthlyClients
  const monthlyProfit = monthlyRevenue - monthlyCost
  const margin = monthlyRevenue > 0 ? ((monthlyProfit / monthlyRevenue) * 100).toFixed(1) : '0.0'
  const annualProfit = monthlyProfit * 12

  // Score stratégie basé sur les leviers sélectionnés
  const strategyScore = Math.min(95, 40 + selectedLevers.length * 12)

  // Default roadmap template when no API data
  const displayRoadmap = roadmap.length > 0 ? roadmap : [
    { phase: 'Phase 1', title: 'Fondations', period: 'Mois 1-3', tasks: ['Validation du modèle économique', 'Mise en place du MVP', 'Premiers tests clients'], status: 'completed' },
    { phase: 'Phase 2', title: 'Croissance', period: 'Mois 4-6', tasks: ['Lancement marketing digital', 'Développement partenariats', 'Optimisation processus'], status: 'in_progress' },
    { phase: 'Phase 3', title: 'Expansion', period: 'Mois 7-12', tasks: ['Nouveaux marchés', 'Recrutement clé', 'Levée de fonds'], status: 'upcoming' },
  ]

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header + Score */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Stratégie de croissance</h3>
                  <p className="text-sm text-gray-500">Définissez vos leviers et analysez votre rentabilité</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-violet-600">{strategyScore}</p>
                <p className="text-xs text-gray-500">Score stratégie</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 5 Leviers de croissance */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                5 Leviers de croissance
              </CardTitle>
              <Badge variant="secondary" className="bg-violet-50 text-violet-700">
                {selectedLevers.length}/5 sélectionnés
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {growthLevers.map((lever) => {
                const isSelected = selectedLevers.includes(lever.id)
                return (
                  <motion.div
                    key={lever.id}
                    whileHover={{ y: -2 }}
                    onClick={() => toggleLever(lever.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? `${lever.color} shadow-sm`
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg ${lever.iconBg} flex items-center justify-center`}>
                        <lever.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{lever.name}</p>
                        <p className="text-[10px] text-gray-500">{lever.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">Impact: {lever.impact}</Badge>
                      <Badge variant="outline" className="text-[10px]">Effort: {lever.effort}</Badge>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rentabilité des offres */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Simulateur de rentabilité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Prix de l&apos;offre (EUR/mois)</label>
                <Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Coût de revient (EUR/mois)</label>
                <Input type="number" value={offerCost} onChange={(e) => setOfferCost(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Clients mensuels</label>
                <Input type="number" value={monthlyClients} onChange={(e) => setMonthlyClients(Number(e.target.value))} className="rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Taux de croissance attendu (%)</label>
                <Input type="number" value={growthRateInput} onChange={(e) => setGrowthRateInput(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Capital disponible (EUR)</label>
                <Input type="number" value={availableCapital} onChange={(e) => setAvailableCapital(Number(e.target.value))} className="rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <p className="text-2xl font-bold text-emerald-600">{monthlyRevenue.toLocaleString('fr-FR')} EUR</p>
                <p className="text-xs text-gray-500">CA mensuel</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                <p className="text-2xl font-bold text-red-600">{monthlyCost.toLocaleString('fr-FR')} EUR</p>
                <p className="text-xs text-gray-500">Coûts mensuels</p>
              </div>
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-center">
                <p className="text-2xl font-bold text-violet-600">{margin}%</p>
                <p className="text-xs text-gray-500">Marge bénéficiaire</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-2xl font-bold text-amber-600">{annualProfit.toLocaleString('fr-FR')} EUR</p>
                <p className="text-xs text-gray-500">Résultat annuel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SWOT */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Analyse SWOT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Forces */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm text-emerald-800 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" /> Forces
                  </p>
                  <button onClick={() => setActiveSwot('forces')} className="text-xs text-emerald-600 hover:underline">+ Ajouter</button>
                </div>
                <div className="space-y-2">
                  {swotItems.forces.length === 0 ? (
                    <p className="text-xs text-emerald-600/60 italic">Aucune force ajoutée</p>
                  ) : (
                    swotItems.forces.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-sm text-emerald-700">{item}</span>
                        <button onClick={() => removeSwotItem('forces', i)} className="text-emerald-400 hover:text-red-500"><Minus className="w-3.5 h-3.5" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Faiblesses */}
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm text-red-800 flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4" /> Faiblesses
                  </p>
                  <button onClick={() => setActiveSwot('faiblesses')} className="text-xs text-red-600 hover:underline">+ Ajouter</button>
                </div>
                <div className="space-y-2">
                  {swotItems.faiblesses.length === 0 ? (
                    <p className="text-xs text-red-600/60 italic">Aucune faiblesse ajoutée</p>
                  ) : (
                    swotItems.faiblesses.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-sm text-red-700">{item}</span>
                        <button onClick={() => removeSwotItem('faiblesses', i)} className="text-red-400 hover:text-red-600"><Minus className="w-3.5 h-3.5" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Opportunités */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm text-blue-800 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Opportunités
                  </p>
                  <button onClick={() => setActiveSwot('opportunites')} className="text-xs text-blue-600 hover:underline">+ Ajouter</button>
                </div>
                <div className="space-y-2">
                  {swotItems.opportunites.length === 0 ? (
                    <p className="text-xs text-blue-600/60 italic">Aucune opportunité ajoutée</p>
                  ) : (
                    swotItems.opportunites.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-sm text-blue-700">{item}</span>
                        <button onClick={() => removeSwotItem('opportunites', i)} className="text-blue-400 hover:text-red-500"><Minus className="w-3.5 h-3.5" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Menaces */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Menaces
                  </p>
                  <button onClick={() => setActiveSwot('menaces')} className="text-xs text-amber-600 hover:underline">+ Ajouter</button>
                </div>
                <div className="space-y-2">
                  {swotItems.menaces.length === 0 ? (
                    <p className="text-xs text-amber-600/60 italic">Aucune menace ajoutée</p>
                  ) : (
                    swotItems.menaces.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                        <span className="text-sm text-amber-700">{item}</span>
                        <button onClick={() => removeSwotItem('menaces', i)} className="text-amber-400 hover:text-red-500"><Minus className="w-3.5 h-3.5" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Add item input */}
            <div className="mt-4 flex items-center gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSwotItem()}
                placeholder={`Ajouter un élément aux ${activeSwot}...`}
                className="flex-1 rounded-xl"
              />
              <Button onClick={addSwotItem} size="icon" className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Roadmap stratégique */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Roadmap stratégique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayRoadmap.map((phase) => (
                <div key={phase.phase} className="p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={phase.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : phase.status === 'in_progress' ? 'bg-violet-50 text-violet-700' : 'bg-gray-100 text-gray-500'}>
                        {phase.phase}
                      </Badge>
                      <span className="font-semibold text-sm">{phase.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">{phase.period}</span>
                  </div>
                  <div className="space-y-1.5">
                    {phase.tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        {task}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
