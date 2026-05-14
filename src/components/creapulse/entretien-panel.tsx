'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  ClipboardList,
  Plus,
  Save,
  FileText,
  Clock,
  User,
  ChevronRight,
  Trash2,
  Edit3,
  Loader2,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

interface Note {
  id: string
  title: string
  content: string
  date: string
  tag: string
}

export default function EntretienPanel() {
  const userId = useAppStore((s) => s.userId)
  const [notes, setNotes] = useState<Note[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTag, setNewTag] = useState('Profil')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Fetch existing notes on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchNotes = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/notes?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setNotes(data.notes || [])
        }
      } catch {
        // Silently fail — start with empty list
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [userId])

  const addNote = useCallback(async () => {
    if (!newTitle.trim() || !newContent.trim() || !userId) return
    setIsSaving(true)

    const optimisticNote: Note = {
      id: String(Date.now()),
      title: newTitle.trim(),
      content: newContent.trim(),
      date: new Date().toLocaleString('fr-FR'),
      tag: newTag,
    }

    // Optimistic update
    setNotes((prev) => [optimisticNote, ...prev])
    setNewTitle('')
    setNewContent('')

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: optimisticNote.title,
          content: optimisticNote.content,
          tag: optimisticNote.tag,
          userId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Replace optimistic note with server response
        setNotes((prev) =>
          prev.map((n) =>
            n.id === optimisticNote.id
              ? { ...n, id: data.note.id }
              : n
          )
        )
      } else {
        // Remove optimistic note on failure
        setNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id))
      }
    } catch {
      // Remove optimistic note on failure
      setNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id))
    } finally {
      setIsSaving(false)
    }
  }, [newTitle, newContent, newTag, userId])

  const deleteNote = useCallback(async (id: string) => {
    if (!userId) return
    setIsDeleting(id)

    const previousNotes = [...notes]

    // Optimistic delete
    setNotes((prev) => prev.filter((n) => n.id !== id))

    try {
      const res = await fetch(`/api/notes?id=${id}&userId=${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        // Restore on failure
        setNotes(previousNotes)
      }
    } catch {
      // Restore on failure
      setNotes(previousNotes)
    } finally {
      setIsDeleting(null)
    }
  }, [userId, notes])

  const tagColors: Record<string, string> = {
    'Profil': 'bg-emerald-100 text-emerald-700',
    'Financier': 'bg-blue-100 text-blue-700',
    'Alerte': 'bg-red-100 text-red-700',
    'Stratégie': 'bg-violet-100 text-violet-700',
    'Suivi': 'bg-amber-100 text-amber-700',
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Notes d&apos;entretien</h3>
                <p className="text-sm text-gray-500">Prenez des notes structurées pendant vos sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formulaire */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              Nouvelle note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titre de la note..."
                className="flex-1 rounded-xl"
              />
              <div className="w-36">
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
                >
                  {Object.keys(tagColors).map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Contenu de la note..."
              className="rounded-xl min-h-[120px]"
            />
            <div className="flex justify-end">
              <Button onClick={addNote} disabled={!newTitle.trim() || !newContent.trim() || isSaving} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sauvegarde...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Sauvegarder</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Liste des notes */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Historique des notes
              </CardTitle>
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">{notes.length} notes</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Chargement des notes...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">Aucune note pour le moment</p>
                <p className="text-xs text-gray-400 mt-1">Créez votre première note ci-dessus</p>
              </div>
            ) : (
              notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <p className="font-semibold text-sm text-gray-900">{note.title}</p>
                      <Badge variant="secondary" className={`text-[10px] ${tagColors[note.tag] || 'bg-gray-100 text-gray-600'}`}>
                        {note.tag}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteNote(note.id)}
                        disabled={isDeleting === note.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        {isDeleting === note.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 pl-6 mb-2">{note.content}</p>
                  <div className="flex items-center gap-2 pl-6">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400">{note.date}</span>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
