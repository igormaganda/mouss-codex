'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign,
  Landmark,
  HandCoins,
  PiggyBank,
  TrendingUp,
  Calculator,
  CreditCard,
  Users,
  Award,
  Building2,
  Globe,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const financingSources = [
  { id: 'personal', name: 'Apport personnel', icon: PiggyBank, maxAmount: 50000, rate: 0, duration: 'N/A', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', description: 'Épargne, famille, amis' },
  { id: 'bank', name: 'Prêt bancaire', icon: Landmark, maxAmount: 300000, rate: 3.5, duration: '5-7 ans', color: 'bg-blue-100 text-blue-700 border-blue-200', description: 'Prêt classique ou PCE' },
  { id: 'bpi', name: 'Bpifrance', icon: Award, maxAmount: 150000, rate: 0, duration: 'Variable', color: 'bg-violet-100 text-violet-700 border-violet-200', description: 'Prêt d\'aménagement, subventions' },
  { id: 'investors', name: 'Investisseurs', icon: Users, maxAmount: 500000, rate: 0, duration: 'Variable', color: 'bg-amber-100 text-amber-700 border-amber-200', description: 'Business angels, love money' },
  { id: 'crowdfunding', name: 'Crowdfunding', icon: Globe, maxAmount: 100000, rate: 0, duration: '1-3 mois', color: 'bg-rose-100 text-rose-700 border-rose-200', description: 'Lendosphere, Ulule, KissKiss' },
  { id: 'subsidies', name: 'Subventions BGE/FR', icon: Building2, maxAmount: 8000, rate: 0, duration: 'Variable', color: 'bg-sky-100 text-sky-700 border-sky-200', description: 'Aide à la création, ARE, ARCE' },
  { id: 'leasing', name: 'Crédit-bail / Leasing', icon: CreditCard, maxAmount: 75000, rate: 4.2, duration: '3-5 ans', color: 'bg-orange-100 text-orange-700 border-orange-200', description: 'Équipements, véhicules, immobilier' },
]

interface PlanItem {
  label: string
  amount: number
  status: string
}

export default function FinancingPanel() {
  const userId = useAppStore((s) => s.userId)
  const [totalNeed, setTotalNeed] = useState(0)
  const [selectedSources, setSelectedSources] = useState<Record<string, number>>({})
  const [loanAmount, setLoanAmount] = useState(0)
  const [loanRate, setLoanRate] = useState(3.5)
  const [loanDuration, setLoanDuration] = useState(60)
  const [planItems, setPlanItems] = useState<PlanItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch existing financing data on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchFinancing = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/financing?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.plan) {
            setTotalNeed(data.plan.totalNeed || 0)
            setSelectedSources(data.plan.selectedSources || {})
            setPlanItems(data.plan.planItems || [])
          }
        }
      } catch {
        // Silently fail — start with empty values
      } finally {
        setIsLoading(false)
      }
    }

    fetchFinancing()
  }, [userId])

  const totalSelected = Object.values(selectedSources).reduce((a, b) => a + b, 0)
  const coveragePercent = totalNeed > 0 ? Math.min(100, (totalSelected / totalNeed) * 100) : 0
  const missingAmount = Math.max(0, totalNeed - totalSelected)

  // Calcul mensualité
  const monthlyRate = loanRate / 100 / 12
  const monthlyPayment = loanAmount > 0 && loanRate > 0
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanDuration)) / (Math.pow(1 + monthlyRate, loanDuration) - 1)
    : loanAmount > 0 ? loanAmount / loanDuration : 0
  const totalRepayment = monthlyPayment * loanDuration
  const totalInterest = totalRepayment - loanAmount

  // Save financing data when key values change (debounced)
  const saveFinancing = useCallback(async () => {
    if (!userId) return
    try {
      await fetch('/api/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financingNeed: totalNeed,
          selectedSources: Object.keys(selectedSources),
          selectedAmounts: selectedSources,
        }),
      })
    } catch {
      // Silently fail
    }
  }, [userId, totalNeed, selectedSources])

  useEffect(() => {
    if (!isLoading && userId) {
      const timer = setTimeout(saveFinancing, 1000)
      return () => clearTimeout(timer)
    }
  }, [totalNeed, selectedSources, saveFinancing, isLoading, userId])

  const toggleSource = (id: string, amount: number) => {
    setSelectedSources((prev) => {
      const newAmounts = { ...prev }
      if (amount > 0) newAmounts[id] = amount
      else delete newAmounts[id]
      return newAmounts
    })
  }

  if (isLoading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-500">Chargement du plan de financement...</span>
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
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Financement</h3>
                <p className="text-sm text-gray-500">Planifiez et simulez votre plan de financement</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Besoin en financement</span>
                <span className="text-blue-600 font-semibold">{totalNeed.toLocaleString('fr-FR')} EUR</span>
              </div>
              <Input
                type="number"
                value={totalNeed}
                onChange={(e) => setTotalNeed(Number(e.target.value))}
                className="rounded-xl max-w-xs"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Barre de couverture */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Couverture du financement</p>
              <Badge variant="secondary" className={coveragePercent >= 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                {coveragePercent.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={coveragePercent} className="h-3 bg-gray-100" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{totalSelected.toLocaleString('fr-FR')} EUR collectés</span>
              {missingAmount > 0 ? (
                <span className="text-xs text-amber-600 font-medium">
                  Il manque {missingAmount.toLocaleString('fr-FR')} EUR
                </span>
              ) : totalNeed > 0 ? (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Financement complet
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 7 Sources de financement */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-amber-500" />
              Sources de financement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {financingSources.map((source) => {
                const isSelected = Object.keys(selectedSources).includes(source.id)
                return (
                  <motion.div
                    key={source.id}
                    whileHover={{ y: -2 }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected ? source.color : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                    onClick={() => toggleSource(source.id, isSelected ? 0 : Math.min(source.maxAmount, missingAmount + (selectedSources[source.id] || 0)))}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <source.icon className="w-5 h-5" />
                      <div>
                        <p className="font-semibold text-sm">{source.name}</p>
                        <p className="text-[10px] opacity-80">{source.description}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2">
                        <Input
                          type="number"
                          value={selectedSources[source.id] || 0}
                          onChange={(e) => toggleSource(source.id, Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg h-8 text-sm"
                          placeholder="Montant (EUR)"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {source.rate > 0 && (
                        <Badge variant="outline" className="text-[10px]">{source.rate}%/an</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">Max {source.maxAmount.toLocaleString('fr-FR')} EUR</Badge>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan de financement détaillé */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Plan de financement détaillé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planItems.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400">Aucune ligne de dépense enregistrée</p>
                  <p className="text-xs text-gray-400 mt-1">Ajoutez votre besoin en financement ci-dessus pour commencer</p>
                </div>
              ) : (
                planItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      {item.status === 'confirmed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.amount.toLocaleString('fr-FR')} EUR</span>
                  </div>
                ))
              )}
              {planItems.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 mt-2">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-sm font-bold text-gray-900">{planItems.reduce((a, b) => a + b.amount, 0).toLocaleString('fr-FR')} EUR</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Simulateur de remboursement */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4 text-violet-500" />
              Simulateur de remboursement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Capital emprunté (EUR)</label>
                <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Taux annuel (%)</label>
                <Input type="number" step="0.1" value={loanRate} onChange={(e) => setLoanRate(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Durée (mois)</label>
                <Input type="number" value={loanDuration} onChange={(e) => setLoanDuration(Number(e.target.value))} className="rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-center">
                <p className="text-xl font-bold text-violet-600">{monthlyPayment.toFixed(0)} EUR</p>
                <p className="text-xs text-gray-500">Mensualité</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-xl font-bold text-amber-600">{totalInterest.toFixed(0)} EUR</p>
                <p className="text-xs text-gray-500">Coût total intérêts</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <p className="text-xl font-bold text-blue-600">{totalRepayment.toFixed(0)} EUR</p>
                <p className="text-xs text-gray-500">Remboursement total</p>
              </div>
            </div>

            {/* Graphique amortissement simplifié */}
            {totalRepayment > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Répartition capital / intérêts</p>
                <div className="w-full h-6 rounded-full bg-amber-100 overflow-hidden flex">
                  <div
                    className="h-full bg-violet-500 transition-all"
                    style={{ width: `${(loanAmount / totalRepayment) * 100}%` }}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${(totalInterest / totalRepayment) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span className="text-xs text-gray-500">Capital ({((loanAmount / totalRepayment) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="text-xs text-gray-500">Intérêts ({((totalInterest / totalRepayment) * 100).toFixed(0)}%)</span>
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
