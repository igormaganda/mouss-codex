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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  Factory,
  Users,
  DollarSign,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target,
  Lightbulb,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

export default function ScaleChangePanel() {
  const userId = useAppStore((s) => s.userId)
  const [currentProduction, setCurrentProduction] = useState(500)
  const [targetProduction, setTargetProduction] = useState(2000)
  const [unitPrice, setUnitPrice] = useState(45)
  const [currentCost, setCurrentCost] = useState(18)
  const [expansionCost, setExpansionCost] = useState(85000)
  const [newEmployees, setNewEmployees] = useState(3)
  const [avgSalary, setAvgSalary] = useState(28000)
  const [savedMsg, setSavedMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    const fetchSaved = async () => {
      try {
        const res = await fetch(`/api/scale-change?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.currentProduction != null) setCurrentProduction(data.currentProduction)
          if (data.targetProduction != null) setTargetProduction(data.targetProduction)
          if (data.unitPrice != null) setUnitPrice(data.unitPrice)
          if (data.currentCost != null) setCurrentCost(data.currentCost)
          if (data.expansionCost != null) setExpansionCost(data.expansionCost)
          if (data.newEmployees != null) setNewEmployees(data.newEmployees)
          if (data.avgSalary != null) setAvgSalary(data.avgSalary)
        }
      } catch { /* use defaults */ }
    }
    fetchSaved()
  }, [userId])

  const handleSave = async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/scale-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentProduction,
          targetProduction,
          unitPrice,
          currentCost,
          expansionCost,
          newEmployees,
          avgSalary,
        }),
      })
      if (res.ok) {
        setSavedMsg('Données sauvegardées !')
        setTimeout(() => setSavedMsg(''), 3000)
      }
    } catch { /* silent */ } finally {
      setIsSaving(false)
    }
  }

  const currentRevenue = currentProduction * unitPrice
  const currentTotalCost = currentProduction * currentCost
  const currentProfit = currentRevenue - currentTotalCost

  const targetRevenue = targetProduction * unitPrice
  // Economies d'échelle : coût unitaire diminue de 10-20%
  const scaledCost = Math.round(currentCost * (1 - 0.15 * (1 - currentProduction / targetProduction)))
  const targetTotalCost = targetProduction * scaledCost + expansionCost + (newEmployees * avgSalary)
  const targetProfit = targetRevenue - targetTotalCost

  const roi = ((targetProfit - currentProfit) / expansionCost * 100).toFixed(1)
  const profitMargin = ((targetProfit / targetRevenue) * 100).toFixed(1)
  const breakevenMonths = expansionCost > 0
    ? Math.ceil(expansionCost / ((targetProfit - currentProfit) / 12))
    : 0

  const scenarios = [
    { name: 'Conservateur', factor: 0.7, color: 'bg-amber-500' },
    { name: 'Base', factor: 1.0, color: 'bg-emerald-500' },
    { name: 'Optimiste', factor: 1.3, color: 'bg-violet-500' },
  ]

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Factory className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Changement d&apos;Échelle</h3>
                <p className="text-sm text-gray-500">Simulez votre passage à l&apos;échelle supérieure</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Paramètres d'entrée */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-500" />
              Paramètres actuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Production actuelle (unités/mois)</label>
                <Input type="number" value={currentProduction} onChange={(e) => setCurrentProduction(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Production cible (unités/mois)</label>
                <Input type="number" value={targetProduction} onChange={(e) => setTargetProduction(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Prix unitaire (EUR)</label>
                <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Coût unitaire actuel (EUR)</label>
                <Input type="number" value={currentCost} onChange={(e) => setCurrentCost(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Investissement expansion (EUR)</label>
                <Input type="number" value={expansionCost} onChange={(e) => setExpansionCost(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Nouveaux employés</label>
                <Input type="number" value={newEmployees} onChange={(e) => setNewEmployees(Number(e.target.value))} className="rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <Button onClick={handleSave} disabled={isSaving} variant="outline" className="rounded-xl gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
        {savedMsg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />{savedMsg}
          </motion.p>
        )}
      </motion.div>

      {/* KPIs principaux */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ROI estimé', value: `${roi}%`, icon: TrendingUp, color: Number(roi) >= 0 ? 'text-emerald-600' : 'text-red-600', bg: Number(roi) >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
          { label: 'Seuil de rentabilité', value: `${breakevenMonths} mois`, icon: Target, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Marge bénéficiaire', value: `${profitMargin}%`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Coût unitaire cible', value: `${scaledCost} EUR`, icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-50' },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={fadeIn}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Comparaison avant/après */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Comparaison Avant / Après expansion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Avant */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-4">Situation actuelle</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Chiffre d&apos;affaires</span>
                    <span className="font-semibold">{currentRevenue.toLocaleString('fr-FR')} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Coûts totaux</span>
                    <span className="font-semibold">{currentTotalCost.toLocaleString('fr-FR')} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Résultat net</span>
                    <span className={`font-bold ${currentProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {currentProfit.toLocaleString('fr-FR')} EUR
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Marge</span>
                    <span className="font-semibold">{((currentProfit / currentRevenue) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Flèche */}
              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ x: -10 }}
                  animate={{ x: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <ArrowUpRight className="w-8 h-8 text-emerald-500" />
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    +{((targetProduction / currentProduction - 1) * 100).toFixed(0)}% production
                  </Badge>
                </motion.div>
              </div>

              {/* Après */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm font-semibold text-emerald-800 mb-4">Après expansion</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Chiffre d&apos;affaires</span>
                    <span className="font-semibold">{targetRevenue.toLocaleString('fr-FR')} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Coûts totaux</span>
                    <span className="font-semibold">{targetTotalCost.toLocaleString('fr-FR')} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Résultat net</span>
                    <span className={`font-bold ${targetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {targetProfit.toLocaleString('fr-FR')} EUR
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Marge</span>
                    <span className="font-semibold">{profitMargin}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scenarios */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Scénarios de simulation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scenarios.map((scenario) => {
                const scenRevenue = targetProduction * scenario.factor * unitPrice
                const scenProfit = scenRevenue - targetTotalCost * (scenario.factor < 1 ? 0.85 : scenario.factor > 1 ? 1.1 : 1)
                return (
                  <div key={scenario.name} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                    <div className={`w-3 h-3 rounded-full ${scenario.color}`} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{scenario.name}</p>
                      <p className="text-xs text-gray-500">{Math.round(targetProduction * scenario.factor)} unités/mois</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{scenRevenue.toLocaleString('fr-FR')} EUR</p>
                      <p className={`text-xs font-medium ${scenProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {scenProfit >= 0 ? '+' : ''}{scenProfit.toLocaleString('fr-FR')} EUR résultat
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Graphique barres CA */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Projection de croissance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-48">
              {[0, 1, 2, 3, 4, 5].map((year) => {
                const factor = 1 + (year * (targetProduction / currentProduction - 1) / 3)
                const revenue = currentProduction * factor * unitPrice
                const pct = (revenue / (targetProduction * unitPrice)) * 100
                return (
                  <div key={year} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.min(pct, 100)}%` }}
                      transition={{ delay: year * 0.1, duration: 0.5 }}
                      className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[4px]"
                    />
                    <span className="text-[10px] text-gray-400">
                      {year === 0 ? 'Actuel' : `An ${year}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
