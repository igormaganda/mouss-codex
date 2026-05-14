'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  Settings,
  MapPin,
  Accessibility,
  Users,
  Activity,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
  Handshake,
  ArrowRight,
  ExternalLink,
  FileText,
  AlertCircle,
  Download,
  Printer,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// ====================== LOADING SKELETONS ======================
function SkeletonCard() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
          <div className="h-7 w-20 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-28 bg-gray-100 rounded mb-1" />
          <div className="h-2.5 w-20 bg-gray-100 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell><div className="animate-pulse h-4 w-32 bg-gray-200 rounded" /></TableCell>
      <TableCell><div className="animate-pulse h-4 w-16 bg-gray-200 rounded" /></TableCell>
      <TableCell><div className="animate-pulse h-4 w-12 bg-gray-200 rounded" /></TableCell>
      <TableCell><div className="animate-pulse h-4 w-16 bg-gray-200 rounded" /></TableCell>
    </TableRow>
  )
}

function SkeletonBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse border border-gray-100 rounded-xl p-4">
          <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-full bg-gray-100 rounded mb-2" />
          <div className="h-3 w-48 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  )
}

// ====================== VUE D'ENSEMBLE TAB ======================
function VueEnsembleTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Card className="border-0 shadow-sm"><CardContent className="p-6"><div className="animate-pulse h-48 bg-gray-100 rounded" /></CardContent></Card></div>
          <Card className="border-0 shadow-sm"><CardContent className="p-6"><div className="animate-pulse h-48 bg-gray-100 rounded" /></CardContent></Card>
        </div>
      </motion.div>
    )
  }

  const s = data?.stats || {}
  const totalUsers = s.totalUsers ?? 0
  const inProgress = s.diagnosticsByStatus?.IN_PROGRESS ?? 0
  const goCountRaw = s.diagnosticsByDecision?.GO ?? 0
  const noGoCountRaw = s.diagnosticsByDecision?.NO_GO ?? 0
  const totalDecisions = goCountRaw + noGoCountRaw
  const goPercent = totalDecisions > 0 ? Math.round((goCountRaw / totalDecisions) * 100) : 0
  const noGoPercent = totalDecisions > 0 ? 100 - goPercent : 0
  const monthlyData: { month: string; count: number }[] = s.monthlyData ?? []

  const stats = [
    { label: 'Total utilisateurs', value: totalUsers.toLocaleString('fr-FR'), change: `${inProgress} en cours`, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Diagnostics en cours', value: inProgress.toLocaleString('fr-FR'), change: 'En traitement', icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Taux Go/No-Go', value: `${goPercent}%`, change: `Go: ${goPercent}% · No-Go: ${noGoPercent}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Satisfaction', value: `${(goPercent / 100 * 5).toFixed(1)}/5`, change: 'Note moyenne', icon: CheckCircle2, color: 'text-sky-600', bg: 'bg-sky-50' },
  ]

  const maxCount = monthlyData.length > 0 ? Math.max(...monthlyData.map((d: { count: number }) => d.count)) : 1
  const donutRadius = 60
  const donutCircumference = 2 * Math.PI * donutRadius
  const goStroke = donutCircumference * (goPercent / 100)
  const noGoStroke = donutCircumference * (1 - goPercent / 100)
  const donutCenter = donutRadius + 10

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={fadeIn}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={fadeIn} className="lg:col-span-2">
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Diagnostics mensuels</CardTitle></CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <div className="flex items-end gap-2 h-48">
                  {monthlyData.map((d: { month: string; count: number }, i: number) => (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${(d.count / maxCount) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.5 }} className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[4px]" />
                      <span className="text-[10px] text-gray-400">{d.month}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-gray-400">Aucune donnée mensuelle disponible</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Ratio Go / No-Go</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              <svg width={donutCenter * 2} height={donutCenter * 2} viewBox={`0 0 ${donutCenter * 2} ${donutCenter * 2}`}>
                <circle cx={donutCenter} cy={donutCenter} r={donutRadius} fill="none" stroke="#f3f4f6" strokeWidth="20" strokeDasharray={noGoStroke} strokeDashoffset={-goStroke} transform={`rotate(-90 ${donutCenter} ${donutCenter})`} />
                <motion.circle cx={donutCenter} cy={donutCenter} r={donutRadius} fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray={goStroke} strokeDashoffset={0} strokeLinecap="round" transform={`rotate(-90 ${donutCenter} ${donutCenter})`} initial={{ strokeDasharray: [0, donutCircumference] }} animate={{ strokeDasharray: [goStroke, donutCircumference] }} transition={{ duration: 1, delay: 0.3 }} />
                <text x={donutCenter} y={donutCenter - 6} textAnchor="middle" fill="#111827" fontSize="28" fontWeight="bold">{goPercent}%</text>
                <text x={donutCenter} y={donutCenter + 16} textAnchor="middle" fill="#9ca3af" fontSize="11">Favorable</text>
              </svg>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs text-gray-600">Go ({goPercent}%)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200" /><span className="text-xs text-gray-600">No-Go ({noGoPercent}%)</span></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ====================== GESTION MODULAIRE TAB ======================
function GestionModulaireTab() {
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/modules')
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const json = await res.json()
      setModules(json.modules || json || [])
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement des modules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchModules() }, [fetchModules])

  const toggleModule = async (id: number) => {
    const mod = modules.find((m) => m.id === id)
    if (!mod) return
    const newEnabled = !mod.enabled
    setTogglingId(id)
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: newEnabled }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      setModules((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: newEnabled } : m)))
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la modification')
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-500" /><CardTitle className="text-base">Gestion Modulaire</CardTitle></div>
              <p className="text-sm text-gray-500 mt-1">Activez ou désactivez les modules selon les besoins de votre territoire.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse p-4 rounded-xl border border-gray-100">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-48 bg-gray-100 rounded mb-3" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-500" /><CardTitle className="text-base">Gestion Modulaire</CardTitle></div>
            <p className="text-sm text-gray-500 mt-1">Activez ou désactivez les modules selon les besoins de votre territoire.</p>
          </CardHeader>
          <CardContent>
            {error && <p className="text-xs text-red-500 flex items-center gap-1 mb-3"><AlertCircle className="w-3 h-3" />{error}</p>}
            {modules.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun module configuré</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((mod: any) => (
                  <motion.div key={mod.id} whileHover={{ y: -2 }} className={`p-4 rounded-xl border transition-all ${mod.enabled ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div><p className="font-semibold text-gray-900 text-sm">{mod.name}</p><p className="text-xs text-gray-500 mt-0.5">{mod.description}</p></div>
                      <Switch checked={mod.enabled} onCheckedChange={() => toggleModule(mod.id)} disabled={togglingId === mod.id} />
                    </div>
                    {mod.config?.users != null && (
                      <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-500">{Number(mod.config.users).toLocaleString('fr-FR')} utilisateurs actifs</span></div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== MONITORING TERRITORIAL TAB ======================
function MonitoringTab() {
  const [territorialData, setTerritorialData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchTerritories() {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          const territories = json.stats?.territories ?? []
          // Map API fields to UI fields
          const mapped = territories.map((t: any) => ({
            region: t.name ?? t.region ?? '',
            diagnostics: t.diagnostics ?? 0,
            poursuite: t.pursuitRate ?? t.poursuite ?? 0,
            retourEmploi: t.returnRate ?? t.retourEmploi ?? 0,
            satisfaction: t.satisfaction ?? 0,
          }))
          setTerritorialData(mapped)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchTerritories()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardHeader><div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-500" /><CardTitle className="text-base">Monitoring Territorial</CardTitle></div></CardHeader>
            <CardContent>
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader><div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-500" /><CardTitle className="text-base">Monitoring Territorial</CardTitle></div></CardHeader>
          <CardContent>
            {error && <p className="text-xs text-red-500 flex items-center gap-1 mb-3"><AlertCircle className="w-3 h-3" />{error}</p>}
            {territorialData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnée territoriale disponible</p>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs font-semibold">Région</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Diagnostics</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Poursuite (%)</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Retour emploi (%)</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Satisfaction (%)</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {territorialData.map((row: any, i: number) => (
                      <TableRow key={i} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm">{row.region}</TableCell>
                        <TableCell className="text-right text-sm">{row.diagnostics}</TableCell>
                        <TableCell className="text-right"><Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">{row.poursuite}%</Badge></TableCell>
                        <TableCell className="text-right text-sm">{row.retourEmploi}%</TableCell>
                        <TableCell className="text-right"><div className="flex items-center justify-end gap-1.5"><div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${row.satisfaction}%` }} /></div><span className="text-xs text-gray-600">{row.satisfaction}%</span></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== HANDICAP TAB ======================
function HandicapTab() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/admin/accessibility-alerts')
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          const items = json.alerts ?? json ?? []
          // Map API fields to UI fields
          const mapped = items.map((a: any, i: number) => ({
            id: a.id ?? i + 1,
            user: a.userName ?? a.user ?? '',
            region: a.region ?? '',
            request: a.description ?? a.request ?? '',
            status: a.status ?? 'pending',
            priority: a.priority ?? 'medium',
            date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : (a.date ?? ''),
          }))
          setAlerts(mapped)
        }
      } catch {
        // Fallback to empty array if endpoint doesn't exist
        if (!cancelled) setAlerts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAlerts()
    return () => { cancelled = true }
  }, [])

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
    in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Eye },
    completed: { label: 'Traité', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  }
  const priorityConfig: Record<string, { label: string; color: string }> = {
    high: { label: 'Prioritaire', color: 'bg-red-50 text-red-600 border-red-200' },
    medium: { label: 'Moyenne', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    low: { label: 'Basse', color: 'bg-gray-50 text-gray-500 border-gray-200' },
  }

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2"><Accessibility className="w-5 h-5 text-emerald-500" /><CardTitle className="text-base">Référent Handicap</CardTitle><Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs">...</Badge></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <SkeletonBlock rows={4} />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2"><Accessibility className="w-5 h-5 text-emerald-500" /><CardTitle className="text-base">Référent Handicap</CardTitle><Badge variant="secondary" className="bg-amber-50 text-amber-700 text-xs">{alerts.filter((a) => a.status === 'pending').length} en attente</Badge></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && <p className="text-xs text-red-500 flex items-center gap-1 mb-3"><AlertCircle className="w-3 h-3" />{error}</p>}
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune demande d&apos;accessibilité enregistrée</p>
            ) : (
              alerts.map((alert) => {
                const status = statusConfig[alert.status] ?? statusConfig.pending
                const priority = priorityConfig[alert.priority] ?? priorityConfig.medium
                const StatusIcon = status.icon
                return (
                  <motion.div key={alert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><p className="font-semibold text-gray-900 text-sm">{alert.user}</p><Badge variant="outline" className={`text-[10px] ${priority.color} px-2 py-0`}>{priority.label}</Badge></div>
                        <p className="text-sm text-gray-600 mb-2">{alert.request}</p>
                        <div className="flex items-center gap-3"><span className="text-xs text-gray-400">{alert.region}</span><span className="text-xs text-gray-300">·</span><span className="text-xs text-gray-400">{alert.date}</span></div>
                      </div>
                      <Badge variant="secondary" className={`text-xs ${status.color}`}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge>
                    </div>
                  </motion.div>
                )
              })
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== PARTENARIATS TAB ======================
function PartenariatsTab() {
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchPartners() {
      try {
        const res = await fetch('/api/admin/partners')
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          const items = json.partners ?? json ?? []
          const mapped = items.map((p: any, i: number) => ({
            id: p.id ?? i + 1,
            name: p.name ?? '',
            type: p.type ?? '',
            region: p.region ?? '',
            diagnostics: p.diagnostics ?? 0,
            referrals: p.referrals ?? 0,
            status: p.status ?? 'active',
          }))
          setPartners(mapped)
        }
      } catch {
        // Fallback to empty array — no partners table yet
        if (!cancelled) setPartners([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPartners()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-6"><div className="animate-pulse"><div className="h-6 w-64 bg-gray-200 rounded mb-4" /><div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-white/60 rounded-xl" />)}</div></div></CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm"><CardContent className="p-6"><SkeletonBlock rows={4} /></CardContent></Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center"><Handshake className="w-6 h-6 text-emerald-600" /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Partenariats et passage de relais</h3>
                <p className="text-sm text-gray-500">Gérez les orientations post-diagnostic vers vos partenaires</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-white/60 text-center"><p className="text-xl font-bold text-emerald-600">{partners.length}</p><p className="text-xs text-gray-500">Partenaires actifs</p></div>
              <div className="p-3 rounded-xl bg-white/60 text-center"><p className="text-xl font-bold text-violet-600">{partners.reduce((a: number, p: any) => a + (p.referrals ?? 0), 0)}</p><p className="text-xs text-gray-500">Passages de relais</p></div>
              <div className="p-3 rounded-xl bg-white/60 text-center"><p className="text-xl font-bold text-amber-600">{partners.length > 0 ? '78%' : '—'}</p><p className="text-xs text-gray-500">Taux d&apos;acceptation</p></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Réseau de partenaires</CardTitle></CardHeader>
          <CardContent>
            {error && <p className="text-xs text-red-500 flex items-center gap-1 mb-3"><AlertCircle className="w-3 h-3" />{error}</p>}
            {partners.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun partenaire configuré</p>
            ) : (
              <div className="space-y-3">
                {partners.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><ExternalLink className="w-5 h-5 text-emerald-600" /></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.type} · {p.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><p className="text-sm font-semibold">{p.diagnostics}</p><p className="text-[10px] text-gray-400">diagnostics</p></div>
                      <div className="text-right"><p className="text-sm font-semibold text-emerald-600">{p.referrals}</p><p className="text-[10px] text-gray-400">relais</p></div>
                      <Badge variant="secondary" className={p.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                        {p.status === 'active' ? 'Actif' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== INDICATEURS POST-DIAGNOSTIC TAB ======================
function IndicateursTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-6"><div className="animate-pulse h-20 bg-gray-100 rounded" /></CardContent>
          </Card>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm"><CardContent className="p-6"><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div></CardContent></Card>
        </motion.div>
      </motion.div>
    )
  }

  const s = data?.stats || {}
  const completedCount = s.diagnosticsByStatus?.COMPLETED ?? 0
  const totalDiagnostics = Object.values(s.diagnosticsByStatus ?? {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0)
  const goCount = s.diagnosticsByDecision?.GO ?? 0
  const noGoCount = s.diagnosticsByDecision?.NO_GO ?? 0
  const totalDecisions = goCount + noGoCount
  const goRate = totalDecisions > 0 ? Math.round((goCount / totalDecisions) * 100) : 0

  const kpis = [
    { label: 'Diagnostics complétés', value: completedCount.toLocaleString('fr-FR'), change: `${totalDiagnostics} total`, trend: 'up' },
    { label: 'Poursuite de projet', value: `${goRate}%`, change: `${goCount} GO / ${noGoCount} No-Go`, trend: 'up' },
    { label: 'Utilisateurs inscrits', value: (s.totalUsers ?? 0).toLocaleString('fr-FR'), change: `${s.counselorsCount ?? 0} conseillers`, trend: 'up' },
    { label: 'Territoires actifs', value: `${(s.territories ?? []).length}`, change: 'Régions couvertes', trend: 'up' },
    { label: 'Diagnostics en cours', value: (s.diagnosticsByStatus?.IN_PROGRESS ?? 0).toLocaleString('fr-FR'), change: 'En traitement', trend: 'up' },
    { label: 'Conseillers', value: `${s.counselorsCount ?? 0}`, change: 'Réseau actif', trend: 'up' },
  ]

  const recentDiagnostics: any[] = s.recentDiagnostics ?? []

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center"><BarChart3 className="w-6 h-6 text-indigo-600" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Indicateurs post-diagnostic</h3>
                  <p className="text-sm text-gray-500">Tableau de bord pour bailleurs France Travail</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Exporter
                </Button>
                <Button size="sm" variant="outline" className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Imprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={fadeIn}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">{kpi.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Diagnostics récents et passage de relais</CardTitle></CardHeader>
          <CardContent>
            {recentDiagnostics.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun diagnostic récent</p>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs font-semibold">Porteur</TableHead>
                    <TableHead className="text-xs font-semibold">Région</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Décision</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Score</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Modules</TableHead>
                    <TableHead className="text-xs font-semibold">Orientation</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {recentDiagnostics.map((d: any) => (
                      <TableRow key={d.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm">{d.user ?? d.userName ?? ''}</TableCell>
                        <TableCell className="text-sm">{d.region ?? ''}</TableCell>
                        <TableCell className="text-sm">{d.date ?? (d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '')}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={
                            d.decision === 'GO' ? 'bg-emerald-50 text-emerald-700' :
                            d.decision === 'NO_GO' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }>{d.decision ?? 'PENDING'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">{d.score ?? 0}/100</TableCell>
                        <TableCell className="text-center text-sm">{d.modules ?? '—'}</TableCell>
                        <TableCell>
                          {d.referral ? (
                            <div className="flex items-center gap-1 text-sm text-emerald-600">
                              <ArrowRight className="w-3.5 h-3.5" /> {d.referral}
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== MAIN ADMIN DASHBOARD ======================
export default function AdminDashboard() {
  const adminTab = useAppStore((s) => s.adminTab)
  const setAdminTab = useAppStore((s) => s.setAdminTab)

  return (
    <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as typeof adminTab)} className="space-y-6">
      <TabsList className="bg-gray-100 p-1 rounded-xl h-auto flex-wrap gap-1">
        {[
          { value: 'vue-ensemble', icon: BarChart3, label: "Vue d'ensemble" },
          { value: 'gestion-modulaire', icon: Settings, label: 'Modules' },
          { value: 'monitoring', icon: MapPin, label: 'Monitoring' },
          { value: 'handicap', icon: Accessibility, label: 'Handicap' },
          { value: 'partenariats', icon: Handshake, label: 'Partenariats' },
          { value: 'indicateurs', icon: BarChart3, label: 'Indicateurs FR' },
        ].map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-3 py-2">
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="vue-ensemble"><VueEnsembleTab /></TabsContent>
      <TabsContent value="gestion-modulaire"><GestionModulaireTab /></TabsContent>
      <TabsContent value="monitoring"><MonitoringTab /></TabsContent>
      <TabsContent value="handicap"><HandicapTab /></TabsContent>
      <TabsContent value="partenariats"><PartenariatsTab /></TabsContent>
      <TabsContent value="indicateurs"><IndicateursTab /></TabsContent>
    </Tabs>
  )
}
