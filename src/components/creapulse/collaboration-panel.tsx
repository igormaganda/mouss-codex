'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Users,
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Filter,
  FileText,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Loader2,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

interface FeedbackItem {
  id: string
  module: string
  author: string
  authorRole: 'counselor' | 'user'
  content: string
  rating: number
  date: string
  isPrivate: boolean
}

const moduleTabs = [
  'Tous',
  'Bilan Découverte',
  'RIASEC',
  'Compétences',
  'Marché',
  'Financier',
  'Stratégie',
  'Financement',
  'Changement d\'Échelle',
]

export default function CollaborationPanel() {
  const userId = useAppStore((s) => s.userId)
  const userName = useAppStore((s) => s.userName)
  const [activeModule, setActiveModule] = useState('Tous')
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([])
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedModuleForComment, setSelectedModuleForComment] = useState('Bilan Découverte')
  const [showPrivate, setShowPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Fetch existing feedback on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchFeedback = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/collaboration/feedback?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          const feedback = (data.feedback || []).map((f: { id: string; module: string; author: string; authorRole: string; content: string; rating: number; date: string; isPrivate: boolean }) => ({
            ...f,
            authorRole: f.authorRole as 'counselor' | 'user',
          }))
          setFeedbackList(feedback)
        }
      } catch {
        // Silently fail — start with empty list
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeedback()
  }, [userId])

  const filteredFeedback = feedbackList.filter((f) => {
    if (activeModule !== 'Tous' && f.module !== activeModule) return false
    if (f.isPrivate && !showPrivate) return false
    return true
  })

  const addFeedback = async () => {
    if (!newComment.trim() || !userId) return
    setIsSending(true)

    const optimisticItem: FeedbackItem = {
      id: `opt-${Date.now()}`,
      module: selectedModuleForComment,
      author: userName || 'Conseiller',
      authorRole: 'counselor',
      content: newComment.trim(),
      rating: newRating,
      date: new Date().toLocaleDateString('fr-FR'),
      isPrivate,
    }

    // Optimistic update
    setFeedbackList((prev) => [optimisticItem, ...prev])
    setNewComment('')
    setNewRating(0)
    setIsPrivate(false)

    try {
      const res = await fetch('/api/collaboration/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: selectedModuleForComment,
          content: newComment.trim(),
          rating: newRating,
          isPrivate,
          authorId: userId,
          author: userName || 'Conseiller',
          authorRole: 'counselor',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Replace optimistic item with server item
        setFeedbackList((prev) =>
          prev.map((f) =>
            f.id === optimisticItem.id
              ? { ...f, id: data.feedback.id, date: data.feedback.date || f.date }
              : f
          )
        )
      } else {
        // Remove optimistic item on failure
        setFeedbackList((prev) => prev.filter((f) => f.id !== optimisticItem.id))
      }
    } catch {
      // Remove optimistic item on failure
      setFeedbackList((prev) => prev.filter((f) => f.id !== optimisticItem.id))
    } finally {
      setIsSending(false)
    }
  }

  const averageRating = feedbackList.filter((f) => f.rating > 0).length > 0
    ? (feedbackList.filter((f) => f.rating > 0).reduce((a, b) => a + b.rating, 0) / feedbackList.filter((f) => f.rating > 0).length).toFixed(1)
    : '—'

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-sky-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Collaboration</h3>
                  <p className="text-sm text-gray-500">Notes partagées et feedback module par module</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-sky-600">{feedbackList.length}</p>
                  <p className="text-xs text-gray-500">Notes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{averageRating}</p>
                  <p className="text-xs text-gray-500">Note moy.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtres par module */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                Review par module
              </CardTitle>
              <button
                onClick={() => setShowPrivate(!showPrivate)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
              >
                {showPrivate ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                Notes privées
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {moduleTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveModule(tab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeModule === tab
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Feedback list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-sky-500 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Chargement des feedbacks...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFeedback.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">Aucun feedback pour le moment</p>
                  </div>
                )}
                {filteredFeedback.map((fb) => (
                  <motion.div
                    key={fb.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${
                      fb.isPrivate
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-gray-100 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fb.authorRole === 'counselor' ? 'bg-violet-100' : 'bg-emerald-100'}`}>
                          <span className={`text-xs font-bold ${fb.authorRole === 'counselor' ? 'text-violet-600' : 'text-emerald-600'}`}>
                            {fb.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{fb.author}</p>
                          <p className="text-[10px] text-gray-400">{fb.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{fb.module}</Badge>
                        {fb.isPrivate && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Privé</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{fb.content}</p>
                    {fb.rating > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Formulaire d'ajout */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Ajouter un feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-gray-600">Module concerné</label>
                <select
                  value={selectedModuleForComment}
                  onChange={(e) => setSelectedModuleForComment(e.target.value)}
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
                >
                  {moduleTabs.filter(t => t !== 'Tous').map((tab) => (
                    <option key={tab} value={tab}>{tab}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-gray-600">Note (optionnel)</label>
                <div className="flex items-center gap-1 h-10 px-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setNewRating(s === newRating ? 0 : s)}>
                      <Star className={`w-5 h-5 transition-colors ${s <= newRating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 hover:text-amber-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`flex items-center gap-1.5 px-3 h-10 rounded-xl border text-xs font-medium transition-all ${
                  isPrivate ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                {isPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {isPrivate ? 'Privé' : 'Public'}
              </button>
            </div>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrivez votre feedback ou note ici..."
              className="rounded-xl min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button onClick={addFeedback} disabled={!newComment.trim() || isSending} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                {isSending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Envoyer</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
