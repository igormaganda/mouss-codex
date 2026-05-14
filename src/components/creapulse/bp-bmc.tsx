'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  LayoutGrid,
  Loader2,
  Sparkles,
  Download,
  Pencil,
  Check,
  RotateCcw,
  FileText,
  Lightbulb,
  Handshake,
  Wrench,
  Package,
  Gem,
  Heart,
  Megaphone,
  Users,
  Receipt,
  Wallet,
  Building2,
  Target,
  TrendingUp,
} from 'lucide-react'

// ====================== TYPES ======================
interface BmcBlock {
  title: string
  items: string[]
  color: string
}

interface BmcData {
  keyPartners: BmcBlock
  keyActivities: BmcBlock
  keyResources: BmcBlock
  valueProposition: BmcBlock
  customerRelationships: BmcBlock
  channels: BmcBlock
  customerSegments: BmcBlock
  costStructure: BmcBlock
  revenueStreams: BmcBlock
}

type BmcBlockKey = keyof BmcData

// ====================== DEFAULT COLORS ======================
const DEFAULT_COLORS: Record<BmcBlockKey, string> = {
  keyPartners: '#6366f1',
  keyActivities: '#8b5cf6',
  keyResources: '#06b6d4',
  valueProposition: '#f59e0b',
  customerRelationships: '#10b981',
  channels: '#3b82f6',
  customerSegments: '#ef4444',
  costStructure: '#f97316',
  revenueStreams: '#22c55e',
}

// ====================== BLOCK CONFIGURATION ======================
interface BlockConfig {
  key: BmcBlockKey
  title: string
  icon: React.ElementType
  gridColumn: string
  gridRow: string
}

const BLOCKS: BlockConfig[] = [
  { key: 'keyPartners', title: 'Partenaires Clés', icon: Handshake, gridColumn: '1 / 4', gridRow: '1 / 2' },
  { key: 'keyActivities', title: 'Activités Clés', icon: Wrench, gridColumn: '4 / 7', gridRow: '1 / 2' },
  { key: 'keyResources', title: 'Ressources Clés', icon: Package, gridColumn: '7 / 11', gridRow: '1 / 2' },
  { key: 'valueProposition', title: 'Proposition de Valeur', icon: Gem, gridColumn: '1 / 5', gridRow: '2 / 3' },
  { key: 'customerRelationships', title: 'Relations Clients', icon: Heart, gridColumn: '5 / 7', gridRow: '2 / 3' },
  { key: 'channels', title: 'Canaux', icon: Megaphone, gridColumn: '7 / 9', gridRow: '2 / 3' },
  { key: 'customerSegments', title: 'Segments Clients', icon: Users, gridColumn: '9 / 11', gridRow: '2 / 3' },
  { key: 'costStructure', title: 'Structure de Coûts', icon: Receipt, gridColumn: '1 / 6', gridRow: '3 / 4' },
  { key: 'revenueStreams', title: 'Flux de Revenus', icon: Wallet, gridColumn: '6 / 11', gridRow: '3 / 4' },
]

// ====================== ANIMATION VARIANTS ======================
const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
}

// ====================== SUGGESTED VALUES ======================
const STAGE_OPTIONS = [
  'Idée / Concept',
  'Validation',
  'Prototype / MVP',
  'Lancement',
  'Croissance',
  'Maturité',
]

// ====================== MAIN COMPONENT ======================
export default function BusinessModelCanvas() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null

  // Form state
  const [projectName, setProjectName] = useState('')
  const [sector, setSector] = useState('')
  const [description, setDescription] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [currentStage, setCurrentStage] = useState('')
  const [showStageDropdown, setShowStageDropdown] = useState(false)

  // BMC state
  const [bmcData, setBmcData] = useState<BmcData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editing state
  const [editingBlock, setEditingBlock] = useState<BmcBlockKey | null>(null)
  const [editText, setEditText] = useState('')

  // ==================== GENERATE BMC ====================
  const generateBmc = useCallback(async () => {
    if (!projectName.trim() || !sector.trim()) return

    setLoading(true)
    setIsGenerating(true)
    setError(null)
    setBmcData(null)

    try {
      const res = await fetch('/api/business-plan/bmc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          sector: sector.trim(),
          description: description.trim() || undefined,
          targetMarket: targetMarket.trim() || undefined,
          currentStage: currentStage.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erreur lors de la génération du BMC")
        return
      }

      // Merge response with defaults for any missing blocks
      const merged: BmcData = {} as BmcData
      for (const block of BLOCKS) {
        const apiBlock = data[block.key]
        merged[block.key] = {
          title: apiBlock?.title || block.title,
          items: apiBlock?.items || [],
          color: apiBlock?.color || DEFAULT_COLORS[block.key],
        }
      }
      setBmcData(merged)
    } catch {
      setError('Erreur de connexion. Veuillez vérifier votre réseau.')
    } finally {
      setLoading(false)
      setIsGenerating(false)
    }
  }, [projectName, sector, description, targetMarket, currentStage, token])

  // ==================== EDITING ====================
  const startEditing = useCallback((key: BmcBlockKey) => {
    if (!bmcData) return
    setEditingBlock(key)
    setEditText(bmcData[key].items.join('\n'))
  }, [bmcData])

  const saveEditing = useCallback(() => {
    if (!editingBlock || !bmcData) return
    const items = editText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    setBmcData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [editingBlock]: {
          ...prev[editingBlock],
          items,
        },
      }
    })
    setEditingBlock(null)
    setEditText('')
  }, [editingBlock, editText, bmcData])

  const cancelEditing = useCallback(() => {
    setEditingBlock(null)
    setEditText('')
  }, [])

  // ==================== EXPORT ====================
  const exportToText = useCallback(() => {
    if (!bmcData) return

    const lines: string[] = []
    lines.push('═'.repeat(60))
    lines.push(`  BUSINESS MODEL CANVAS — ${projectName || 'Projet'}`)
    if (sector) lines.push(`  Secteur : ${sector}`)
    if (currentStage) lines.push(`  Stade : ${currentStage}`)
    lines.push(`  Généré le : ${new Date().toLocaleDateString('fr-FR')}`)
    lines.push('═'.repeat(60))
    lines.push('')

    for (const block of BLOCKS) {
      const data = bmcData[block.key]
      lines.push(`┌─ ${data.title.toUpperCase()} ${'─'.repeat(Math.max(0, 53 - data.title.length))}`)
      lines.push('│')
      if (data.items.length === 0) {
        lines.push('│   (vide)')
      } else {
        data.items.forEach((item, i) => {
          lines.push(`│   ${i + 1}. ${item}`)
        })
      }
      lines.push('│')
      lines.push(`└${'─'.repeat(58)}`)
      lines.push('')
    }

    lines.push('═'.repeat(60))
    lines.push(`  Généré par CréaScope — ${new Date().toLocaleString('fr-FR')}`)
    lines.push('═'.repeat(60))

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bmc-${(projectName || 'projet').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [bmcData, projectName, sector, currentStage])

  // ==================== RESET ====================
  const resetAll = useCallback(() => {
    setBmcData(null)
    setError(null)
    setEditingBlock(null)
    setEditText('')
  }, [])

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* ==================== FORM SECTION ==================== */}
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Business Model Canvas</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Générez un BMC complet grâce à l&apos;intelligence artificielle
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1: Project Name + Sector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom du projet <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lightbulb className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Ex: MonRestoConcept"
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Secteur d&apos;activité <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Ex: Restauration, Tech, E-commerce..."
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description du projet
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre projet, votre produit ou service, ce qui le rend unique..."
                className="rounded-xl border-gray-200 dark:border-gray-700 resize-none min-h-[80px]"
              />
            </div>

            {/* Row 3: Target Market + Current Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Marché cible
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                    placeholder="Ex: Jeunes actifs urbains, PME..."
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stade actuel
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <button
                    type="button"
                    onClick={() => setShowStageDropdown(!showStageDropdown)}
                    onBlur={() => setTimeout(() => setShowStageDropdown(false), 200)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    {currentStage || (
                      <span className="text-gray-400">Sélectionnez un stade...</span>
                    )}
                  </button>
                  <AnimatePresence>
                    {showStageDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                      >
                        {STAGE_OPTIONS.map((stage) => (
                          <button
                            key={stage}
                            type="button"
                            onMouseDown={() => {
                              setCurrentStage(stage)
                              setShowStageDropdown(false)
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors ${
                              currentStage === stage ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium' : ''
                            }`}
                          >
                            {stage}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateBmc}
              disabled={!projectName.trim() || !sector.trim() || loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-11 shadow-md shadow-amber-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer le BMC
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ==================== ERROR STATE ==================== */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateBmc}
                  className="shrink-0 rounded-lg border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== LOADING STATE ==================== */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-pulse">
                      <LayoutGrid className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Analyse de votre modèle d&apos;affaires...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      L&apos;IA construit les 9 blocs de votre canvas
                    </p>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== BMC GRID ==================== */}
      <AnimatePresence>
        {bmcData && !isGenerating && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-4"
          >
            {/* Header bar */}
            <motion.div
              variants={fadeIn}
              className="flex items-center justify-between flex-wrap gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {projectName || 'Business Model Canvas'}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {sector}{currentStage ? ` · ${currentStage}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToText}
                  className="rounded-lg text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export en texte
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateBmc}
                  disabled={loading}
                  className="rounded-lg text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Régénérer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAll}
                  className="rounded-lg text-xs text-gray-500 hover:text-red-600"
                >
                  Effacer
                </Button>
              </div>
            </motion.div>

            {/* The BMC Grid */}
            <motion.div variants={fadeIn}>
              <div
                className="grid gap-1.5 md:gap-2"
                style={{
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gridTemplateRows: 'auto auto auto',
                }}
              >
                {BLOCKS.map((config, index) => {
                  const block = bmcData[config.key]
                  const Icon = config.icon
                  const isEditing = editingBlock === config.key

                  return (
                    <motion.div
                      key={config.key}
                      variants={scaleIn}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        gridColumn: config.gridColumn,
                        gridRow: config.gridRow,
                      }}
                    >
                      <Card className="rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden h-full">
                        {/* Color header bar */}
                        <div
                          className="h-1 w-full"
                          style={{ backgroundColor: block.color }}
                        />

                        {/* Block header */}
                        <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${block.color}15`,
                              }}
                            >
                              <Icon
                                className="w-3.5 h-3.5"
                                style={{ color: block.color }}
                              />
                            </div>
                            <h4
                              className="text-xs font-semibold truncate"
                              style={{ color: block.color }}
                            >
                              {block.title}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                              style={{
                                backgroundColor: `${block.color}12`,
                                color: block.color,
                              }}
                            >
                              {block.items.length}
                            </Badge>
                          </div>

                          {/* Edit button */}
                          <button
                            onClick={() =>
                              isEditing ? saveEditing() : startEditing(config.key)
                            }
                            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                            title={isEditing ? 'Sauvegarder' : 'Modifier'}
                          >
                            {isEditing ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Pencil className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                        </div>

                        {/* Block content */}
                        <div className="px-3 pb-2.5">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="min-h-[100px] text-xs rounded-lg border-gray-200 dark:border-gray-700 resize-y font-mono"
                                placeholder="Un item par ligne..."
                                autoFocus
                              />
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={saveEditing}
                                  className="h-7 text-[11px] rounded-md bg-emerald-500 hover:bg-emerald-600 text-white"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Valider
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditing}
                                  className="h-7 text-[11px] rounded-md"
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : block.items.length === 0 ? (
                            <p className="text-[11px] text-gray-400 italic py-2 text-center">
                              Aucun élément
                            </p>
                          ) : (
                            <ul className="space-y-1">
                              {block.items.map((item, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed"
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                                    style={{ backgroundColor: block.color }}
                                  />
                                  <span className="flex-1">{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Footer info */}
            <motion.div variants={fadeIn}>
              <div className="flex items-center justify-center gap-2 py-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-[11px] text-gray-400">
                  BMC généré par IA · Cliquez sur l&apos;icône crayon pour modifier chaque bloc
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== EMPTY STATE ==================== */}
      {!bmcData && !loading && !isGenerating && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                <LayoutGrid className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Votre Business Model Canvas apparaîtra ici
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm">
                  Remplissez le formulaire ci-dessus et laissez l&apos;IA analyser votre projet pour générer les 9 blocs du canvas.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['Partenaires', 'Activités', 'Valeur', 'Clients', 'Revenus'].map((label) => (
                  <Badge
                    key={label}
                    variant="outline"
                    className="text-[10px] text-gray-400 border-gray-200 dark:border-gray-700"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
