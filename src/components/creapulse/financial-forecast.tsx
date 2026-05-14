'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Calculator,
  Save,
  Download,
  Loader2,
  Sparkles,
  ArrowRight,
  Wallet,
  Receipt,
  PiggyBank,
  BarChart3,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// ====================== TYPES ======================
interface RevenueInputs {
  monthly: number
  clients: number
  avgBasket: number
}

interface ExpenseInputs {
  rent: number
  salaries: number
  charges: number
  marketing: number
  supplies: number
  insurance: number
  other: number
}

interface ProjectionYear {
  year: number
  revenue: number
  expenses: number
  netResult: number
  cumulativeCashFlow: number
}

const DEFAULT_REVENUE: RevenueInputs = {
  monthly: 3000,
  clients: 15,
  avgBasket: 200,
}

const DEFAULT_EXPENSES: ExpenseInputs = {
  rent: 600,
  salaries: 2000,
  charges: 500,
  marketing: 200,
  supplies: 100,
  insurance: 100,
  other: 150,
}

const EXPENSE_LABELS: { key: keyof ExpenseInputs; label: string; icon: typeof Receipt }[] = [
  { key: 'rent', label: 'Loyer / Location', icon: Receipt },
  { key: 'salaries', label: 'Salaires (incl. fondateur)', icon: Wallet },
  { key: 'charges', label: 'Charges sociales', icon: Receipt },
  { key: 'marketing', label: 'Marketing / Communication', icon: BarChart3 },
  { key: 'supplies', label: 'Fournitures / Matériel', icon: Receipt },
  { key: 'insurance', label: 'Assurances', icon: PiggyBank },
  { key: 'other', label: 'Autres dépenses', icon: Receipt },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

// ====================== MAIN COMPONENT ======================
export default function FinancialForecast() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null
  const userId = useAppStore((s) => s.userId)

  const [revenue, setRevenue] = useState<RevenueInputs>(DEFAULT_REVENUE)
  const [expenses, setExpenses] = useState<ExpenseInputs>(DEFAULT_EXPENSES)
  const [growthRate, setGrowthRate] = useState(10)
  const [inflationRate, setInflationRate] = useState(2)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    if (!userId) return
    const fetchSaved = async () => {
      try {
        const res = await fetch(`/api/financial?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.revenue) setRevenue(data.revenue)
          if (data.expenses) setExpenses(data.expenses)
          if (data.growthRate != null) setGrowthRate(data.growthRate)
          if (data.inflationRate != null) setInflationRate(data.inflationRate)
        }
      } catch { /* use defaults */ }
    }
    fetchSaved()
  }, [userId])

  // Calculated values
  const totalMonthlyRevenue = revenue.monthly
  const totalMonthlyExpenses = Object.values(expenses).reduce((s, v) => s + v, 0)
  const monthlyResult = totalMonthlyRevenue - totalMonthlyExpenses
  const annualResult = monthlyResult * 12
  const marginPercentage = totalMonthlyRevenue > 0 ? Math.round((monthlyResult / totalMonthlyRevenue) * 100) : 0
  const breakEvenMonths = monthlyResult > 0 ? 0 : totalMonthlyExpenses > 0 ? Math.ceil(Math.abs(monthlyResult) / (totalMonthlyRevenue > 0 ? totalMonthlyRevenue : 1)) : 0

  // 3-year projection
  const projection: ProjectionYear[] = useMemo(() => {
    const result: ProjectionYear[] = []
    let cumulative = 0
    for (let y = 1; y <= 3; y++) {
      const yearRevenue = totalMonthlyRevenue * 12 * Math.pow(1 + growthRate / 100, y - 1)
      const yearExpenses = totalMonthlyExpenses * 12 * Math.pow(1 + inflationRate / 100, y - 1)
      const net = yearRevenue - yearExpenses
      cumulative += net
      result.push({
        year: y,
        revenue: Math.round(yearRevenue),
        expenses: Math.round(yearExpenses),
        netResult: Math.round(net),
        cumulativeCashFlow: Math.round(cumulative),
      })
    }
    return result
  }, [totalMonthlyRevenue, totalMonthlyExpenses, growthRate, inflationRate])

  const updateRevenue = useCallback((key: keyof RevenueInputs, value: number) => {
    setRevenue((prev) => ({ ...prev, [key]: Math.max(0, value) }))
  }, [])

  const updateExpenses = useCallback((key: keyof ExpenseInputs, value: number) => {
    setExpenses((prev) => ({ ...prev, [key]: Math.max(0, value) }))
  }, [])

  // AI Analysis
  const handleAIAnalysis = async () => {
    setIsLoadingAI(true)
    setAiAnalysis('')
    try {
      const summary = `Prévisionnel financier:\n- CA mensuel: ${formatCurrency(totalMonthlyRevenue)}\n- Charges mensuelles: ${formatCurrency(totalMonthlyExpenses)}\n- Résultat mensuel: ${formatCurrency(monthlyResult)}\n- Résultat annuel: ${formatCurrency(annualResult)}\n- Marge: ${marginPercentage}%\n- Point mort: ${breakEvenMonths} mois\n- Croissance annuelle: ${growthRate}%\n- Inflation: ${inflationRate}%\n- Projection 3 ans: ${projection.map((p) => `A${p.year}: ${formatCurrency(p.netResult)}`).join(', ')}`

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Analyse ce prévisionnel financier de création d'entreprise et donne des recommandations concises en français:\n\n${summary}`,
            },
          ],
          context: { userName: 'Porteur de projet', userRole: 'USER' },
        }),
      })
      const data = await res.json()
      if (res.ok) setAiAnalysis(data.content)
      else setAiAnalysis('Erreur lors de l\'analyse IA.')
    } catch {
      setAiAnalysis('Erreur de connexion.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Save
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          revenue,
          expenses,
          growthRate,
          inflationRate,
          projection,
        }),
      })
      if (res.ok) {
        setSavedMsg('Prévisionnel sauvegardé !')
        setTimeout(() => setSavedMsg(''), 3000)
      }
    } catch { /* silent */ } finally {
      setIsSaving(false)
    }
  }

  // Export JSON
  const handleExport = () => {
    const data = { revenue, expenses, growthRate, inflationRate, projection, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'previsionnel_financier.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Summary Cards */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <TrendingUp className={`w-5 h-5 mb-2 ${totalMonthlyRevenue > 0 ? 'text-emerald-500' : 'text-gray-400'}`} />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalMonthlyRevenue)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">CA mensuel</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Receipt className="w-5 h-5 mb-2 text-amber-500" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalMonthlyExpenses)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Charges mensuelles</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            {monthlyResult >= 0 ? (
              <TrendingUp className="w-5 h-5 mb-2 text-emerald-500" />
            ) : (
              <TrendingDown className="w-5 h-5 mb-2 text-red-500" />
            )}
            <p className={`text-xl font-bold ${monthlyResult >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(monthlyResult)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Résultat mensuel</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Calculator className={`w-5 h-5 mb-2 ${marginPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            <p className={`text-xl font-bold ${marginPercentage >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {marginPercentage}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Marge nette</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Inputs */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Revenus estimés (mensuel)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { key: 'monthly' as const, label: 'CA mensuel estimé', prefix: '€' },
                { key: 'clients' as const, label: 'Nombre de clients', prefix: '' },
                { key: 'avgBasket' as const, label: 'Panier moyen', prefix: '€' },
              ]).map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400">{field.label}</label>
                  <div className="relative">
                    {field.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{field.prefix}</span>}
                    <Input
                      type="number"
                      min={0}
                      value={revenue[field.key]}
                      onChange={(e) => updateRevenue(field.key, parseFloat(e.target.value) || 0)}
                      className={`${field.prefix ? 'pl-7' : ''} rounded-xl`}
                    />
                  </div>
                </div>
              ))}
            </div>
            {revenue.clients > 0 && revenue.avgBasket > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Vérification : {revenue.clients} clients × {formatCurrency(revenue.avgBasket)} = {formatCurrency(revenue.clients * revenue.avgBasket)} / mois
                {Math.abs(revenue.clients * revenue.avgBasket - revenue.monthly) > 1 && (
                  <span className="text-amber-500 ml-2">⚠ Écart avec le CA déclaré</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense Inputs */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base">Charges mensuelles</CardTitle>
              <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Total : {formatCurrency(totalMonthlyExpenses)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {EXPENSE_LABELS.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0">
                  <field.icon className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0">{field.label}</span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                  <Input
                    type="number"
                    min={0}
                    value={expenses[field.key]}
                    onChange={(e) => updateExpenses(field.key, parseFloat(e.target.value) || 0)}
                    className="pl-7 rounded-xl text-right"
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={fadeIn}>
        <Card className={`border-0 shadow-sm bg-gradient-to-r ${
          monthlyResult >= 0
            ? 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
            : 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
        }`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Résultat annuel</p>
                <p className={`text-2xl font-bold ${annualResult >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(annualResult)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Point mort</p>
                <p className={`text-2xl font-bold ${breakEvenMonths === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {breakEvenMonths === 0 ? 'Atteint' : `${breakEvenMonths} mois`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Marge nette</p>
                <p className={`text-2xl font-bold ${marginPercentage >= 20 ? 'text-emerald-600 dark:text-emerald-400' : marginPercentage >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {marginPercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3-Year Projection */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-500" />
                <CardTitle className="text-base">Projection sur 3 ans</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-500">Croissance :</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={growthRate}
                    onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 0)}
                    className="w-16 h-7 text-xs rounded-lg text-center"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-500">Inflation :</label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={inflationRate}
                    onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                    className="w-14 h-7 text-xs rounded-lg text-center"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Année</TableHead>
                    <TableHead className="text-xs text-right">Revenus</TableHead>
                    <TableHead className="text-xs text-right">Charges</TableHead>
                    <TableHead className="text-xs text-right">Résultat net</TableHead>
                    <TableHead className="text-xs text-right">Cash-flow cumulé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projection.map((row) => (
                    <TableRow key={row.year}>
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400">A{row.year}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(row.revenue)}</TableCell>
                      <TableCell className="text-right text-sm text-red-500 dark:text-red-400">{formatCurrency(row.expenses)}</TableCell>
                      <TableCell className={`text-right text-sm font-bold ${row.netResult >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {row.netResult >= 0 ? '+' : ''}{formatCurrency(row.netResult)}
                      </TableCell>
                      <TableCell className={`text-right text-sm font-medium ${row.cumulativeCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(row.cumulativeCashFlow)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Analysis + Actions */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Analyse & Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleAIAnalysis}
              disabled={isLoadingAI}
              className="w-full rounded-xl border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
            >
              {isLoadingAI ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyse IA en cours...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Analyser le prévisionnel avec l&apos;IA</>
              )}
            </Button>

            {aiAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">Analyse IA</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiAnalysis}</p>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSave} disabled={isSaving} variant="outline" className="flex-1 rounded-xl">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Sauvegarder
              </Button>
              <Button onClick={handleExport} variant="outline" className="flex-1 rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Exporter JSON
              </Button>
            </div>

            {savedMsg && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-center text-emerald-600 dark:text-emerald-400">
                {savedMsg}
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
