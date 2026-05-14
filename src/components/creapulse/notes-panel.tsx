'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/hooks/use-store'
import {
  Eye,
  HelpCircle,
  Star,
  Zap,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  CheckSquare,
  Search,
  Sparkles,
  Pin,
  Filter,
  Clock,
  Loader2,
  StickyNote,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const NOTE_CATEGORIES = [
  { value: 'OBSERVATION', label: 'Observation', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye },
  { value: 'QUESTION', label: 'Question', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: HelpCircle },
  { value: 'KEY_POINT', label: 'Point clé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Star },
  { value: 'ACTION_ITEM', label: 'Action', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: Zap },
  { value: 'CONCERN', label: 'Inquiétude', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
  { value: 'STRENGTH', label: 'Force', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: TrendingUp },
  { value: 'IDEA', label: 'Idée', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: Lightbulb },
  { value: 'DECISION', label: 'Décision', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: CheckSquare },
]

const PHASE_OPTIONS = [
  { value: 'all', label: 'Toutes les phases' },
  { value: 'PHASE_1_ACCUEIL', label: 'Phase 1 — Accueil' },
  { value: 'PHASE_2_DIAGNOSTIC', label: 'Phase 2 — Diagnostic' },
  { value: 'PHASE_3_SYNTHESE', label: 'Phase 3 — Synthèse' },
]

interface Note {
  id: string
  content: string
  category: string
  phase: string
  timestamp: string
  isPinned: boolean
  isActionItem: boolean
  actionDone: boolean
  aiSummary: string | null
}

export default function NotesPanel() {
  const userId = useAppStore((s) => s.userId)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('OBSERVATION')
  const [selectedPhase, setSelectedPhase] = useState('PHASE_1_ACCUEIL')
  const [filterPhase, setFilterPhase] = useState('all')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Fetch existing notes from API on mount
  useEffect(() => {
    if (!userId) return
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/interview-notes?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.notes) && data.notes.length > 0) {
            const fetched: Note[] = data.notes.map((n: Record<string, unknown>) => ({
              id: n.id as string,
              content: n.content as string,
              category: n.category as string,
              phase: n.phase as string,
              timestamp: (n.createdAt as string) || (n.timestamp as string) || new Date().toISOString(),
              isPinned: (n.isPinned as boolean) || false,
              isActionItem: (n.isActionItem as boolean) || false,
              actionDone: (n.actionDone as boolean) || false,
              aiSummary: (n.aiSummary as string) || null,
            }))
            setNotes(fetched)
          }
        }
      } catch {
        // silent — fallback to empty local state
      }
    }
    fetchNotes()
  }, [userId])

  const addNote = () => {
    if (!newNote.trim()) return
    const note: Note = {
      id: `note_${Date.now()}`,
      content: newNote.trim(),
      category: selectedCategory,
      phase: selectedPhase,
      timestamp: new Date().toISOString(),
      isPinned: false,
      isActionItem: false,
      actionDone: false,
      aiSummary: null,
    }
    setNotes((prev) => [note, ...prev])
    setNewNote('')

    // Persist to API
    const token = localStorage.getItem('cp_token')
    if (token) {
      fetch('/api/interview-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phase: selectedPhase, category: selectedCategory, content: newNote.trim() }),
      }).catch(() => { /* silent */ })
    }
  }

  const togglePin = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)))
  }

  const toggleActionItem = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isActionItem: !n.isActionItem } : n)))
  }

  const toggleActionDone = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, actionDone: !n.actionDone } : n)))
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const handleSummarize = async () => {
    if (notes.length === 0) return
    setIsSummarizing(true)
    try {
      const noteContents = notes.map((n) => `[${n.category}] ${n.content}`).join('\n')
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Analyse et synthétise ces notes d'entretien entrepreneurial en un paragraphe structuré en français. Identifie les points clés, les forces, les freins et les recommandations :\n\n${noteContents}`,
            },
          ],
          context: { userName: 'Conseiller CréaScope', userRole: 'COUNSELOR' },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAiSummary(data.content)
      }
    } catch {
      // silent
    } finally {
      setIsSummarizing(false)
    }
  }

  // Filtered notes
  const filteredNotes = notes
    .filter((n) => {
      if (filterPhase !== 'all' && n.phase !== filterPhase) return false
      if (filterCategory && n.category !== filterCategory) return false
      if (searchQuery && !n.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

  // Count by category
  const categoryCounts: Record<string, number> = {}
  notes.forEach((n) => {
    categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1
  })

  const getCategoryMeta = (value: string) => NOTE_CATEGORIES.find((c) => c.value === value)

  const getPhaseLabel = (phase: string) => PHASE_OPTIONS.find((p) => p.value === phase)?.label || phase

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Auto-scroll to latest
  useEffect(() => {
    if (timelineRef.current && notes.length > 0) {
      // Just auto scroll on new notes
    }
  }, [notes.length])

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Panel: Note Input */}
        <motion.div variants={fadeIn} className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-violet-500" />
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                  Nouvelle note
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phase selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phase associée</label>
                <div className="flex flex-wrap gap-1.5">
                  {PHASE_OPTIONS.filter((p) => p.value !== 'all').map((phase) => (
                    <button
                      key={phase.value}
                      onClick={() => setSelectedPhase(phase.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        selectedPhase === phase.value
                          ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-violet-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {phase.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Catégorie</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {NOTE_CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs border transition-all ${
                          selectedCategory === cat.value
                            ? `${cat.color} border-current`
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate w-full text-center text-[10px]">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Contenu</label>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Écrivez votre note ici..."
                  className="min-h-[100px] rounded-xl border-gray-200 dark:border-gray-700 text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote()
                  }}
                />
              </div>

              <Button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2"
              >
                <StickyNote className="w-4 h-4" />
                Ajouter la note
              </Button>
            </CardContent>
          </Card>

          {/* AI Summary Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">Synthèse IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleSummarize}
                disabled={notes.length === 0 || isSummarizing}
                variant="outline"
                className="w-full rounded-xl gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
              >
                {isSummarizing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isSummarizing ? 'Analyse en cours...' : 'IA Synthétiser'}
              </Button>

              {aiSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-violet-50 border border-amber-200/50 dark:from-amber-900/20 dark:to-violet-900/20 dark:border-amber-800/50"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Synthèse IA
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {aiSummary}
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Panel: Notes Timeline */}
        <motion.div variants={fadeIn} className="lg:col-span-3 space-y-4">
          {/* Search & Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans les notes..."
                  className="pl-10 h-9 rounded-xl border-gray-200 dark:border-gray-700 text-sm"
                />
              </div>

              {/* Phase filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Phase :</span>
                {PHASE_OPTIONS.map((phase) => (
                  <button
                    key={phase.value}
                    onClick={() => setFilterPhase(phase.value)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      filterPhase === phase.value
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {phase.label}
                  </button>
                ))}
              </div>

              {/* Category filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Catégorie :</span>
                <button
                  onClick={() => setFilterCategory(null)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    filterCategory === null
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  Toutes
                </button>
                {NOTE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFilterCategory(cat.value === filterCategory ? null : cat.value)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      filterCategory === cat.value
                        ? `${cat.color} border-current border`
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {cat.label}
                    {categoryCounts[cat.value] ? (
                      <span className="ml-1 opacity-60">({categoryCounts[cat.value]})</span>
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                <span>{notes.length} note{notes.length !== 1 ? 's' : ''} au total</span>
                <span>{notes.filter((n) => n.isPinned).length} épinglée{notes.filter((n) => n.isPinned).length !== 1 ? 's' : ''}</span>
                <span>{notes.filter((n) => n.isActionItem).length} action{notes.filter((n) => n.isActionItem).length !== 1 ? 's' : ''}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes Timeline */}
          <div ref={timelineRef} className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            <AnimatePresence mode="popLayout">
              {filteredNotes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <StickyNote className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Aucune note pour le moment.
                  </p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                    Commencez à prendre des notes !
                  </p>
                </motion.div>
              ) : (
                filteredNotes.map((note) => {
                  const catMeta = getCategoryMeta(note.category)
                  const Icon = catMeta?.icon || StickyNote
                  const catColor = catMeta?.color || 'bg-gray-100 text-gray-700'

                  return (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className={`group relative p-4 rounded-xl border transition-all ${
                        note.isPinned
                          ? 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-900/10 shadow-sm'
                          : note.isActionItem
                            ? 'border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-900/10'
                            : 'border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-[10px] px-2 py-0 ${catColor}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {catMeta?.label || note.category}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-2 py-0 text-gray-400 border-gray-200 dark:border-gray-700">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            {formatTimestamp(note.timestamp)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => togglePin(note.id)}
                            className={`p-1 rounded-md transition-colors ${
                              note.isPinned
                                ? 'text-amber-500'
                                : 'text-gray-300 hover:text-amber-500 dark:text-gray-600'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleActionItem(note.id)}
                            className={`p-1 rounded-md transition-colors ${
                              note.isActionItem
                                ? 'text-violet-500'
                                : 'text-gray-300 hover:text-violet-500 dark:text-gray-600'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1 rounded-md text-gray-300 hover:text-red-500 transition-colors dark:text-gray-600"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {note.content}
                      </p>

                      {/* Phase badge */}
                      <div className="mt-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-400 border-gray-200 dark:border-gray-700">
                          {getPhaseLabel(note.phase)}
                        </Badge>
                        {note.isPinned && (
                          <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <Pin className="w-2.5 h-2.5 mr-0.5" />
                            Épinglée
                          </Badge>
                        )}
                        {note.isActionItem && (
                          <button
                            onClick={() => toggleActionDone(note.id)}
                            className="ml-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0 rounded-full border transition-all cursor-pointer"
                            style={{
                              backgroundColor: note.actionDone ? undefined : 'rgba(139,92,246,0.1)',
                              borderColor: note.actionDone ? undefined : 'rgba(139,92,246,0.3)',
                              color: note.actionDone ? undefined : 'rgb(109,40,217)',
                            }}
                          >
                            {note.actionDone ? (
                              <CheckSquare className="w-2.5 h-2.5 text-emerald-500" />
                            ) : (
                              <CheckSquare className="w-2.5 h-2.5" />
                            )}
                            {note.actionDone ? 'Fait' : 'À faire'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
