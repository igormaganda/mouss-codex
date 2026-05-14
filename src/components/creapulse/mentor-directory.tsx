'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Star,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Send,
  Calendar,
  MessageSquare,
  Award,
  GraduationCap,
  Briefcase,
  Filter,
  X,
  Sparkles,
  UserPlus,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
} from 'lucide-react'

// ==================== TYPES ====================
type Availability = 'available' | 'limited' | 'unavailable'

interface Mentor {
  id: string
  name: string
  bio: string
  avatar?: string
  expertise: string[]
  sector: string
  location: string
  rating: number
  reviewCount: number
  availability: Availability
  menteeCount: number
  maxMentees: number
}

interface Mentorship {
  id: string
  mentor: Mentor
  status: 'active' | 'pending' | 'completed'
  startDate: string
  nextSession?: { date: string; topic: string }
  notes: string
  sessions: MentorshipSession[]
}

interface MentorshipSession {
  id: string
  date: string
  duration: number
  notes: string
  rating?: number
}

// ==================== CONSTANTS ====================
const AVAILABILITY_CONFIG: Record<Availability, { label: string; color: string; dotColor: string }> = {
  available: { label: 'Disponible', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  limited: { label: 'Limité', color: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
  unavailable: { label: 'Indisponible', color: 'bg-gray-100 text-gray-500 border-gray-200', dotColor: 'bg-gray-400' },
}

const EXPERTISE_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

const SECTORS = [
  'Tous les secteurs',
  'Tech & Digital',
  'Commerce & Distribution',
  'Services aux entreprises',
  'Social & Solidarité',
  'Industrie & Manufacturier',
  'Tourisme & Hôtellerie',
  'Santé & Bien-être',
  'Environnement & Énergie',
]

const LOCATIONS = [
  'Toutes les localisations',
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Provence-Alpes-Côte d\'Azur',
  'Nouvelle-Aquitaine',
  'Occitanie',
]

const MENTORSHIP_OBJECTIVES = [
  { id: 'strategy', label: 'Élaborer ma stratégie d\'entreprise' },
  { id: 'finance', label: 'Comprendre les bases financières' },
  { id: 'marketing', label: 'Développer mon marketing' },
  { id: 'network', label: 'Élargir mon réseau professionnel' },
  { id: 'growth', label: 'Préparer la croissance' },
  { id: 'legal', label: 'Structurer juridiquement mon projet' },
]

// ==================== HELPERS ====================
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function fetchJson<T>(url: string, fallback: T, opts?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, { ...opts, headers: { ...authHeaders(), ...opts?.headers } })
    if (!res.ok) return fallback
    return await res.json()
  } catch {
    return fallback
  }
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
    </div>
  )
}

// ==================== ANIMATIONS ====================
const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}

// ==================== STAR RATING INPUT ====================
function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          onMouseEnter={(e) => { (e.currentTarget.previousElementSibling as HTMLElement)?.classList.add('opacity-50') }}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-6 h-6 transition-colors ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
        </button>
      ))}
      {value > 0 && <span className="text-sm font-medium text-gray-600 ml-2">{value}/5</span>}
    </div>
  )
}

// ==================== MENTOR CARD ====================
function MentorCard({ mentor, onRequestMentorship }: { mentor: Mentor; onRequestMentorship: (m: Mentor) => void }) {
  const availConfig = AVAILABILITY_CONFIG[mentor.availability]

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white text-lg font-bold">
              {mentor.name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{mentor.name}</h3>
              <Badge variant="outline" className={`text-[10px] px-2 py-0 shrink-0 ${availConfig.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${availConfig.dotColor} mr-1`} />
                {availConfig.label}
              </Badge>
            </div>
            {renderStars(mentor.rating)}
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{mentor.bio}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {mentor.expertise.map((exp, i) => (
              <Badge key={exp} variant="secondary" className={`text-[10px] px-2 py-0 border-0 ${EXPERTISE_COLORS[i % EXPERTISE_COLORS.length]}`}>
                {exp}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {mentor.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {mentor.menteeCount}/{mentor.maxMentees} mentorés
            </span>
          </div>
        </div>

        <Button
          onClick={() => onRequestMentorship(mentor)}
          disabled={mentor.availability === 'unavailable'}
          className="w-full mt-4 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mentor.availability === 'unavailable' ? (
            'Indisponible'
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Demander un mentorat
            </>
          )}
        </Button>
      </CardContent>
    </motion.div>
  )
}

// ==================== REQUEST MODAL ====================
function RequestMentorshipModal({
  mentor,
  open,
  onClose,
}: {
  mentor: Mentor | null
  open: boolean
  onClose: () => void
}) {
  const [message, setMessage] = useState('')
  const [objectives, setObjectives] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  if (prevOpen && !open) {
    setMessage('')
    setObjectives([])
    setSent(false)
  }
  if (prevOpen !== open) {
    setPrevOpen(open)
  }

  const toggleObjective = (id: string) => {
    setObjectives((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id])
  }

  const handleSend = async () => {
    if (!mentor) return
    setSending(true)
    await fetchJson('/api/mentorships', null, {
      method: 'POST',
      body: JSON.stringify({ mentorId: mentor.id, message, objectives }),
    })
    setSending(false)
    setSent(true)
  }

  if (!mentor) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Demander un mentorat
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Demande envoyée !</h3>
            <p className="text-sm text-gray-500">
              Votre demande de mentorat auprès de <span className="font-medium">{mentor.name}</span> a été transmise.
            </p>
            <Button onClick={onClose} className="mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Fermer
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white text-sm font-bold">
                  {mentor.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-gray-900">{mentor.name}</p>
                <p className="text-xs text-gray-500">{mentor.sector}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Votre message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre projet et pourquoi vous souhaitez être mentoré(e)..."
                className="min-h-[100px] rounded-xl text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-gray-600">Vos objectifs</label>
              <div className="space-y-2">
                {MENTORSHIP_OBJECTIVES.map((obj) => (
                  <label key={obj.id} className="flex items-start gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={objectives.includes(obj.id)}
                      onCheckedChange={() => toggleObjective(obj.id)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-700">{obj.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                Annuler
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !message.trim() || objectives.length === 0}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                Envoyer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ==================== MENTORSHIP DETAIL ====================
function MentorshipDetail({ mentorship }: { mentorship: Mentorship }) {
  const [showAddSession, setShowAddSession] = useState(false)
  const [sessionDate, setSessionDate] = useState('')
  const [sessionDuration, setSessionDuration] = useState(60)
  const [sessionNotes, setSessionNotes] = useState('')
  const [newRating, setNewRating] = useState(0)

  const handleAddSession = async () => {
    await fetchJson('/api/mentorships/sessions', null, {
      method: 'POST',
      body: JSON.stringify({
        mentorshipId: mentorship.id,
        date: sessionDate,
        duration: sessionDuration,
        notes: sessionNotes,
        rating: newRating > 0 ? newRating : undefined,
      }),
    })
    setShowAddSession(false)
    setSessionDate('')
    setSessionDuration(60)
    setSessionNotes('')
    setNewRating(0)
  }

  return (
    <div className="space-y-4">
      {/* Mentor Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-bold">
                {mentorship.mentor.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">{mentorship.mentor.name}</h4>
              <p className="text-xs text-gray-500">{mentorship.mentor.sector}</p>
            </div>
            <Badge variant="outline" className={
              mentorship.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              mentorship.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-gray-100 text-gray-500 border-gray-200'
            }>
              {mentorship.status === 'active' ? 'Actif' : mentorship.status === 'pending' ? 'En attente' : 'Terminé'}
            </Badge>
          </div>
          {mentorship.nextSession && (
            <div className="mt-3 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs font-medium text-indigo-700">Prochaine session</p>
                <p className="text-[11px] text-indigo-600">{mentorship.nextSession.date} — {mentorship.nextSession.topic}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions Timeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Historique des sessions</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddSession(!showAddSession)}
              className="rounded-xl text-xs h-7"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {showAddSession && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3"
              >
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="rounded-xl text-sm"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Durée :</span>
                  {[30, 45, 60, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSessionDuration(d)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                        sessionDuration === d ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
                <Textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Notes de session..."
                  className="min-h-[60px] rounded-xl text-sm"
                />
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Évaluation :</span>
                  <StarRatingInput value={newRating} onChange={setNewRating} />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddSession(false)} className="rounded-xl text-xs">Annuler</Button>
                  <Button size="sm" onClick={handleAddSession} className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700">
                    Enregistrer
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {mentorship.sessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune session enregistrée</p>
          ) : (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200" />
              {mentorship.sessions.map((session) => (
                <div key={session.id} className="relative flex items-start gap-3">
                  <div className="absolute left-[-18px] top-1 w-4 h-4 rounded-full bg-indigo-100 border-2 border-indigo-500" />
                  <div className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">{session.date}</span>
                      <span className="text-[11px] text-gray-400">{session.duration} min</span>
                    </div>
                    {session.notes && <p className="text-xs text-gray-600 mt-1">{session.notes}</p>}
                    {session.rating && (
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`w-3 h-3 ${i <= session.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Plus(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  )
}

// ==================== MOCK DATA ====================
function getMockMentors(): Mentor[] {
  return [
    {
      id: '1', name: 'Sophie Laurent', bio: 'Entrepreneuse série, 15 ans d\'expérience en strategy digitale. J\'accompagne les porteurs de projets tech vers le succès.',
      expertise: ['Strategy', 'Digital', 'Leadership'], sector: 'Tech & Digital', location: 'Paris', rating: 4.9, reviewCount: 47, availability: 'available', menteeCount: 2, maxMentees: 3,
    },
    {
      id: '2', name: 'Marc Dubois', bio: 'Expert en finance d\'entreprise et levée de fonds. Ancien directeur financier dans plusieurs startups à succès.',
      expertise: ['Finance', 'Investissement', 'Business Plan'], sector: 'Finance', location: 'Lyon', rating: 4.7, reviewCount: 32, availability: 'available', menteeCount: 1, maxMentees: 3,
    },
    {
      id: '3', name: 'Amina Benali', bio: 'Spécialiste en marketing et growth hacking. J\'aide les entrepreneurs à trouver leur marché et à scaler rapidement.',
      expertise: ['Marketing', 'Growth', 'Social Media'], sector: 'Commerce', location: 'Marseille', rating: 4.8, reviewCount: 29, availability: 'limited', menteeCount: 3, maxMentees: 3,
    },
    {
      id: '4', name: 'Thomas Moreau', bio: 'Mentor certifié avec un focus sur l\'innovation sociale. 10 ans d\'expérience en entrepreneuriat à impact.',
      expertise: ['Impact Social', 'Innovation', 'ESS'], sector: 'Social & Solidarité', location: 'Bordeaux', rating: 4.6, reviewCount: 18, availability: 'available', menteeCount: 0, maxMentees: 2,
    },
    {
      id: '5', name: 'Claire Rousseau', bio: 'Avocate spécialisée en droit des affaires et propriété intellectuelle. J\'accompagne sur les aspects juridiques.',
      expertise: ['Juridique', 'PI', 'Contrats'], sector: 'Services', location: 'Toulouse', rating: 4.5, reviewCount: 22, availability: 'unavailable', menteeCount: 3, maxMentees: 3,
    },
    {
      id: '6', name: 'David Kim', bio: 'Développeur entrepreneur, fondateur de 2 SaaS. Expert en product et développement technique.',
      expertise: ['Product', 'SaaS', 'Tech'], sector: 'Tech & Digital', location: 'Nantes', rating: 4.8, reviewCount: 35, availability: 'available', menteeCount: 2, maxMentees: 4,
    },
  ]
}

function getMockMentorships(): Mentorship[] {
  return [
    {
      id: 'ms1', mentor: getMockMentors()[0], status: 'active', startDate: '2024-11-15',
      nextSession: { date: '2025-01-22', topic: 'Stratégie de go-to-market' },
      notes: 'Focus sur la validation du marché et le lancement MVP.',
      sessions: [
        { id: 's1', date: '2025-01-08', duration: 60, notes: 'Bilan du mois : avancées sur le MVP, premiers retours utilisateurs.', rating: 5 },
        { id: 's2', date: '2024-12-18', duration: 45, notes: 'Définition des personas et positionnement.', rating: 4 },
        { id: 's3', date: '2024-12-01', duration: 60, notes: 'Session de découverte et objectifs du mentorat.', rating: 5 },
      ],
    },
    {
      id: 'ms2', mentor: getMockMentors()[1], status: 'pending', startDate: '2025-01-10',
      notes: 'En attente de confirmation pour le premier rendez-vous.',
      sessions: [],
    },
  ]
}

// ==================== MAIN COMPONENT ====================
export default function MentorDirectory() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState('Tous les secteurs')
  const [selectedLocation, setSelectedLocation] = useState('Toutes les localisations')
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [requestModal, setRequestModal] = useState<{ open: boolean; mentor: Mentor | null }>({ open: false, mentor: null })

  useEffect(() => {
    const load = async () => {
      const mentorsData = await fetchJson<Mentor[]>('/api/mentors', [])
      setMentors(mentorsData.length > 0 ? mentorsData : getMockMentors())
      const mentorshipsData = await fetchJson<Mentorship[]>('/api/mentorships', [])
      setMentorships(mentorshipsData.length > 0 ? mentorshipsData : getMockMentorships())
      setLoading(false)
    }
    load()
  }, [])

  const filteredMentors = mentors.filter((m) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!m.name.toLowerCase().includes(q) && !m.bio.toLowerCase().includes(q) && !m.expertise.some((e) => e.toLowerCase().includes(q))) return false
    }
    if (selectedSector !== 'Tous les secteurs' && m.sector !== selectedSector) return false
    if (selectedLocation !== 'Toutes les localisations' && !m.location.includes(selectedLocation)) return false
    if (selectedAvailability !== 'all' && m.availability !== selectedAvailability) return false
    return true
  })

  const topMentors = [...mentors].sort((a, b) => b.rating - a.rating).slice(0, 3)
  const activeMentorships = mentorships.filter((m) => m.status === 'active')
  const pendingMentorships = mentorships.filter((m) => m.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          {/* Header */}
          <motion.div variants={fadeIn}>
            <h1 className="text-2xl font-bold text-gray-900">Répertoire des mentors</h1>
            <p className="text-sm text-gray-500 mt-1">
              Trouvez le mentor idéal pour accompagner votre parcours entrepreneurial.
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={fadeIn}>
            <Tabs defaultValue="directory">
              <TabsList className="bg-gray-100 rounded-xl h-10 p-1">
                <TabsTrigger value="directory" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                  Répertoire
                </TabsTrigger>
                <TabsTrigger value="my-mentorships" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                  Mes Mentorats
                  {mentorships.length > 0 && (
                    <Badge className="ml-1.5 bg-indigo-600 text-white text-[9px] px-1 py-0 h-4">{mentorships.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="top" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                  Top mentors
                </TabsTrigger>
              </TabsList>

              {/* Directory Tab */}
              <TabsContent value="directory" className="mt-6">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher par nom, expertise, domaine..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 rounded-xl border-gray-200 bg-white text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-10 rounded-xl text-xs ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : ''}`}
                  >
                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                    Filtres
                  </Button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-gray-500">Secteur</label>
                              <div className="flex flex-wrap gap-1.5">
                                {SECTORS.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setSelectedSector(s)}
                                    className={`px-2 py-1 text-[11px] rounded-lg border transition-colors ${
                                      selectedSector === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-gray-500">Localisation</label>
                              <div className="flex flex-wrap gap-1.5">
                                {LOCATIONS.map((l) => (
                                  <button
                                    key={l}
                                    onClick={() => setSelectedLocation(l)}
                                    className={`px-2 py-1 text-[11px] rounded-lg border transition-colors ${
                                      selectedLocation === l ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                                    }`}
                                  >
                                    {l}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-gray-500">Disponibilité</label>
                              <div className="flex flex-wrap gap-1.5">
                                {(['all', 'available', 'limited'] as const).map((a) => (
                                  <button
                                    key={a}
                                    onClick={() => setSelectedAvailability(a)}
                                    className={`px-2 py-1 text-[11px] rounded-lg border transition-colors ${
                                      selectedAvailability === a ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                                    }`}
                                  >
                                    {a === 'all' ? 'Toutes' : AVAILABILITY_CONFIG[a].label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mentor Grid */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                            <div className="h-3 bg-gray-100 rounded w-full" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <div className="h-6 w-16 bg-gray-100 rounded-full" />
                          <div className="h-6 w-20 bg-gray-100 rounded-full" />
                          <div className="h-6 w-14 bg-gray-100 rounded-full" />
                        </div>
                        <div className="mt-4 h-9 bg-gray-100 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : filteredMentors.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <Search className="w-7 h-7 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Aucun mentor trouvé</h3>
                      <p className="text-xs text-gray-400">Essayez d'ajuster vos critères de recherche.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-4">{filteredMentors.length} mentor{filteredMentors.length > 1 ? 's' : ''} trouvé{filteredMentors.length > 1 ? 's' : ''}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMentors.map((mentor) => (
                        <MentorCard
                          key={mentor.id}
                          mentor={mentor}
                          onRequestMentorship={(m) => setRequestModal({ open: true, mentor: m })}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* My Mentorships Tab */}
              <TabsContent value="my-mentorships" className="mt-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  {mentorships.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                          <Briefcase className="w-7 h-7 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Aucun mentorat</h3>
                        <p className="text-xs text-gray-400 text-center">Explorez le répertoire pour trouver votre mentor.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    mentorships.map((ms) => (
                      <MentorshipDetail key={ms.id} mentorship={ms} />
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Top Mentors Tab */}
              <TabsContent value="top" className="mt-6">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Menteurs les mieux notés</h2>
                  </div>
                  <div className="space-y-3">
                    {topMentors.map((mentor, index) => (
                      <motion.div
                        key={mentor.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {index + 1}
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-bold">
                            {mentor.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900">{mentor.name}</h4>
                          <p className="text-xs text-gray-500">{mentor.sector} · {mentor.location}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {renderStars(mentor.rating)}
                            <span className="text-[11px] text-gray-400">{mentor.reviewCount} avis</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => setRequestModal({ open: true, mentor })}
                          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                          disabled={mentor.availability === 'unavailable'}
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Contacter
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>

      <RequestMentorshipModal
        mentor={requestModal.mentor}
        open={requestModal.open}
        onClose={() => setRequestModal({ open: false, mentor: null })}
      />
    </div>
  )
}
