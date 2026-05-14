'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Eye,
  MessageCircle,
  ArrowLeft,
  Send,
  ThumbsUp,
  Heart,
  Sparkles,
  Hash,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Filter,
  Menu,
  Lightbulb,
  Briefcase,
  Landmark,
  GraduationCap,
  Scale,
  TrendingUp,
  Users,
  Tag,
  Loader2,
} from 'lucide-react'

// ======================== TYPES ========================

interface Author {
  id: string
  name: string
  avatar?: string
}

interface Discussion {
  id: string
  title: string
  author: Author
  createdAt: string
  category: string
  tags: string[]
  replyCount: number
  viewCount: number
  pinned: boolean
  lastReplyAt: string | null
  lastReplyAuthor: Author | null
  content: string
  replies: Reply[]
}

interface Reply {
  id: string
  author: Author
  createdAt: string
  content: string
  reactions: { type: string; count: number; hasReacted: boolean }[]
  mentions: string[]
}

interface ForumCategory {
  id: string
  name: string
  icon: React.ElementType
  color: string
  description: string
  discussionCount: number
}

// ======================== CONSTANTS ========================

const CATEGORIES: ForumCategory[] = [
  { id: 'general', name: 'Général', icon: MessageCircle, color: 'text-indigo-600', description: 'Discussions générales sur l\'entrepreneuriat', discussionCount: 42 },
  { id: 'creation', name: 'Création', icon: Lightbulb, color: 'text-amber-600', description: 'Démarrer et créer son entreprise', discussionCount: 35 },
  { id: 'financement', name: 'Financement', icon: Landmark, color: 'text-emerald-600', description: 'Subventions, prêts, investisseurs', discussionCount: 28 },
  { id: 'juridique', name: 'Juridique', icon: Scale, color: 'text-blue-600', description: 'Statuts, contrats, réglementation', discussionCount: 19 },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp, color: 'text-rose-600', description: 'Stratégie marketing et communication', discussionCount: 24 },
  { id: 'reseautage', name: 'Réseautage', icon: Users, color: 'text-violet-600', description: 'Événements, partenariats, collaboration', discussionCount: 16 },
  { id: 'formation', name: 'Formation', icon: GraduationCap, color: 'text-teal-600', description: 'Formations et ressources pour entrepreneurs', discussionCount: 12 },
  { id: 'boite-a-outils', name: 'Boîte à outils', icon: Briefcase, color: 'text-orange-600', description: 'Outils, logiciels et ressources pratiques', discussionCount: 21 },
]

const MOCK_AUTHORS: Author[] = [
  { id: 'u1', name: 'Sophie Martin' },
  { id: 'u2', name: 'Thomas Bernard' },
  { id: 'u3', name: 'Amina Diallo' },
  { id: 'u4', name: 'Lucas Petit' },
  { id: 'u5', name: 'Marie Dubois' },
  { id: 'u6', name: 'Pierre Leroy' },
]

const MOCK_DISCUSSIONS: Discussion[] = [
  {
    id: 'd1', title: 'Comment choisir entre SARL et SAS pour une startup tech ?', author: MOCK_AUTHORS[0],
    createdAt: '2025-01-15T10:30:00Z', category: 'juridique',
    tags: ['SARL', 'SAS', 'Startup', 'Tech'], replyCount: 12, viewCount: 345, pinned: true,
    lastReplyAt: '2025-01-18T14:20:00Z', lastReplyAuthor: MOCK_AUTHORS[2],
    content: 'Bonjour à tous ! Je suis en train de créer une startup dans la tech et j\'hésite entre le statut SARL et SAS. Quelqu\'un a-t-il une expérience à partager sur les avantages et inconvénients de chaque statut ? Qu\'est-ce qui a guidé votre choix ? Merci d\'avance pour vos retours !',
    replies: [
      {
        id: 'r1', author: MOCK_AUTHORS[1], createdAt: '2025-01-15T11:45:00Z',
        content: 'Pour une startup tech, je recommande la SAS. La flexibilité au niveau des statuts sociaux des dirigeants est un gros avantage, surtout si vous prévoyez des levées de fonds. Le régime assimilé-salarié est aussi plus protecteur.',
        reactions: [{ type: 'like', count: 8, hasReacted: false }, { type: 'helpful', count: 5, hasReacted: true }], mentions: ['@Sophie Martin'],
      },
      {
        id: 'r2', author: MOCK_AUTHORS[2], createdAt: '2025-01-15T14:20:00Z',
        content: 'Je confirme la recommandation de @Thomas Bernard. La SAS offre aussi plus de souplesse pour les clauses d\'entrée et de sortie des investisseurs. Attention par contre aux charges sociales qui sont plus élevées. N\'hésitez pas à consulter un expert-comptable.',
        reactions: [{ type: 'like', count: 6, hasReacted: false }, { type: 'helpful', count: 4, hasReacted: false }], mentions: ['@Thomas Bernard'],
      },
      {
        id: 'r3', author: MOCK_AUTHORS[0], createdAt: '2025-01-16T09:00:00Z',
        content: 'Merci beaucoup @Thomas Bernard et @Amina Diallo pour ces retours très complets. Je vais opter pour la SAS. Dernière question : est-ce que vous avez des recommandations de cabinets d\'avocats pour la rédaction des statuts ?',
        reactions: [{ type: 'like', count: 2, hasReacted: false }], mentions: ['@Thomas Bernard', '@Amina Diallo'],
      },
    ],
  },
  {
    id: 'd2', title: 'Les meilleures aides à la création d\'entreprise en 2025', author: MOCK_AUTHORS[1],
    createdAt: '2025-01-14T08:15:00Z', category: 'financement',
    tags: ['Aides', 'Subventions', 'BPI', 'ACRE'], replyCount: 8, viewCount: 520, pinned: true,
    lastReplyAt: '2025-01-17T16:30:00Z', lastReplyAuthor: MOCK_AUTHORS[4],
    content: 'Je vous partage un récapitulatif des principales aides disponibles en 2025 pour les créateurs d\'entreprise. N\'hésitez pas à compléter avec vos expériences locales !\n\n1. ACRE (Aide à la Création et à la Reprise d\'Entreprise)\n2. AREF (Aide Régionale)\n3. Prêt d\'honneur Réseau Entreprendre\n4. Bourse French Tech',
    replies: [
      {
        id: 'r4', author: MOCK_AUTHORS[3], createdAt: '2025-01-14T10:00:00Z',
        content: 'Super récap ! Je rajouterais les aides de la BGE qui sont souvent méconnues mais très utiles. Selon votre territoire, il y a aussi des aides spécifiques (métropoles, rural...).',
        reactions: [{ type: 'like', count: 10, hasReacted: true }], mentions: [],
      },
      {
        id: 'r5', author: MOCK_AUTHORS[4], createdAt: '2025-01-17T16:30:00Z',
        content: 'N\'oubliez pas le dispositif NACRE ! C\'est un accompagnement avec un prêt à taux zéro qui peut aller jusqu\'à 10 000 EUR. Toutes les CCI et BGE en disposent.',
        reactions: [{ type: 'like', count: 7, hasReacted: false }, { type: 'helpful', count: 3, hasReacted: false }], mentions: [],
      },
    ],
  },
  {
    id: 'd3', title: 'Première client : comment convaincre sans portfolio ?', author: MOCK_AUTHORS[2],
    createdAt: '2025-01-13T15:00:00Z', category: 'marketing',
    tags: ['Clients', 'Portfolio', 'Prospection', 'Vente'], replyCount: 15, viewCount: 280, pinned: false,
    lastReplyAt: '2025-01-16T11:00:00Z', lastReplyAuthor: MOCK_AUTHORS[5],
    content: 'Je lance mon activité de consulting et je n\'ai pas encore de clients ni de portfolio. Comment faire pour convaincre mes premiers prospects ? Quelles stratégies avez-vous utilisées ?',
    replies: [
      {
        id: 'r6', author: MOCK_AUTHORS[5], createdAt: '2025-01-13T16:30:00Z',
        content: 'Proposez d\'abord une mission d\'audit gratuite ou à prix coûtant. C\'est la meilleure façon de démontrer votre expertise. Une fois le premier client satisfait, les témoignages feront le reste !',
        reactions: [{ type: 'like', count: 9, hasReacted: false }, { type: 'helpful', count: 6, hasReacted: true }], mentions: ['@Amina Diallo'],
      },
    ],
  },
  {
    id: 'd4', title: 'Réseau Entreprendre vs Initiative France : lequel choisir ?', author: MOCK_AUTHORS[3],
    createdAt: '2025-01-12T09:30:00Z', category: 'reseautage',
    tags: ['Réseau', 'Prêt d\'honneur', 'Accompagnement'], replyCount: 6, viewCount: 190, pinned: false,
    lastReplyAt: '2025-01-14T13:00:00Z', lastReplyAuthor: MOCK_AUTHORS[0],
    content: 'Je cherche un accompagnement pour mon projet de création. Je vois souvent cités Réseau Entreprendre et Initiative France. Quelles sont les différences concrètes entre les deux ?',
    replies: [
      {
        id: 'r7', author: MOCK_AUTHORS[0], createdAt: '2025-01-12T11:00:00Z',
        content: 'Les deux sont excellents. Réseau Entreprendre est un réseau de chefs d\'entreprise bénévoles avec un prêt d\'honneur à 0%. Initiative France c\'est des plates-formes locales très ancrées dans les territoires. Le mieux est de contacter les deux et de voir avec qui vous vous sentez le plus à l\'aise.',
        reactions: [{ type: 'like', count: 5, hasReacted: false }], mentions: [],
      },
    ],
  },
  {
    id: 'd5', title: 'Outils de gestion de projet recommandés pour TPE', author: MOCK_AUTHORS[4],
    createdAt: '2025-01-11T14:00:00Z', category: 'boite-a-outils',
    tags: ['Outils', 'Gestion', 'Productivité', 'Gratuit'], replyCount: 10, viewCount: 310, pinned: false,
    lastReplyAt: '2025-01-15T09:45:00Z', lastReplyAuthor: MOCK_AUTHORS[1],
    content: 'Quels outils de gestion de projet utilisez-vous au quotidien pour votre petite entreprise ? Je cherche quelque chose de simple mais efficace, idéalement gratuit pour commencer.',
    replies: [
      {
        id: 'r8', author: MOCK_AUTHORS[1], createdAt: '2025-01-11T15:30:00Z',
        content: 'Trello est parfait pour commencer : gratuit, visuel et très facile à prendre en main. Si vous avez besoin de quelque chose de plus avancé par la suite, Notion ou Monday.com sont d\'excellentes alternatives.',
        reactions: [{ type: 'like', count: 12, hasReacted: true }], mentions: [],
      },
    ],
  },
  {
    id: 'd6', title: 'Comment trouver son premier local commercial ?', author: MOCK_AUTHORS[5],
    createdAt: '2025-01-10T11:00:00Z', category: 'creation',
    tags: ['Local', 'Bail', 'Emplacement', 'Géolocalisation'], replyCount: 4, viewCount: 145, pinned: false,
    lastReplyAt: '2025-01-13T10:20:00Z', lastReplyAuthor: MOCK_AUTHORS[3],
    content: 'Je cherche un local commercial pour ouvrir ma boutique. Par où commencer ? Quels sont les pièges à éviter lors de la signature du bail commercial ?',
    replies: [
      {
        id: 'r9', author: MOCK_AUTHORS[3], createdAt: '2025-01-10T13:00:00Z',
        content: 'Commencez par contacter la CCI de votre ville, ils ont souvent un observatoire de l\'immobilier commercial avec les disponibilités. Négociez toujours le loyer, un pas-de-porte est courant. Et attention au bail 3-6-9 : c\'est engageant !',
        reactions: [{ type: 'like', count: 4, hasReacted: false }, { type: 'helpful', count: 3, hasReacted: false }], mentions: [],
      },
    ],
  },
]

const REACTION_TYPES = [
  { id: 'like', label: 'J\'aime', icon: ThumbsUp },
  { id: 'love', label: 'J\'adore', icon: Heart },
  { id: 'helpful', label: 'Utile', icon: Sparkles },
]

// ======================== ANIMATIONS ========================

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" as const } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

// ======================== HELPERS ========================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

function getAuthorInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase()
}

function getAuthorColor(id: string): string {
  const colors = [
    'from-indigo-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-violet-400 to-purple-500',
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-sky-500',
  ]
  const index = id.charCodeAt(id.length - 1) % colors.length
  return colors[index]
}

async function fetchDiscussions(): Promise<Discussion[]> {
  try {
    const token = localStorage.getItem('cp_token')
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch('/api/forum/discussions', { headers })
    if (res.ok) {
      const data = await res.json()
      if (data.discussions && data.discussions.length > 0) return data.discussions
    }
    return MOCK_DISCUSSIONS
  } catch {
    return MOCK_DISCUSSIONS
  }
}

// ======================== MAIN COMPONENT ========================

export default function ForumDiscussions() {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [newDiscussion, setNewDiscussion] = useState({ title: '', category: '', tags: '', content: '' })
  const [replyContent, setReplyContent] = useState('')
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [creatingDiscussion, setCreatingDiscussion] = useState(false)
  const replyRef = useRef<HTMLTextAreaElement>(null)
  const mentionRef = useRef<HTMLDivElement>(null)

  // Load discussions
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const data = await fetchDiscussions()
      if (!cancelled) {
        setDiscussions(data)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Collect all unique authors for mentions
  const allAuthors = useMemo(() => {
    const authorMap = new Map<string, Author>()
    discussions.forEach((d) => {
      authorMap.set(d.author.id, d.author)
      d.replies?.forEach((r) => authorMap.set(r.author.id, r.author))
    })
    return [...authorMap.values()]
  }, [discussions])

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return allAuthors
    return allAuthors.filter((a) => a.name.toLowerCase().includes(mentionQuery.toLowerCase()))
  }, [allAuthors, mentionQuery])

  // Filter discussions
  const filteredDiscussions = useMemo(() => {
    return discussions.filter((d) => {
      const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory
      const matchesSearch = searchQuery === '' ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [discussions, selectedCategory, searchQuery])

  const pinnedDiscussions = filteredDiscussions.filter((d) => d.pinned)
  const regularDiscussions = filteredDiscussions.filter((d) => !d.pinned)

  const getCategoryById = (id: string) => CATEGORIES.find((c) => c.id === id)

  const handleCreateDiscussion = useCallback(async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.category || !newDiscussion.content.trim()) return
    setCreatingDiscussion(true)
    try {
      const token = localStorage.getItem('cp_token')
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/forum/discussions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...newDiscussion,
          tags: newDiscussion.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })

      if (res.ok) {
        const created = await res.json()
        setDiscussions((prev) => [created.discussion, ...prev])
      } else {
        // Add locally on API failure
        const localDiscussion: Discussion = {
          id: `d-local-${Date.now()}`,
          title: newDiscussion.title,
          author: { id: 'self', name: 'Vous' },
          createdAt: new Date().toISOString(),
          category: newDiscussion.category,
          tags: newDiscussion.tags.split(',').map((t) => t.trim()).filter(Boolean),
          replyCount: 0,
          viewCount: 1,
          pinned: false,
          lastReplyAt: null,
          lastReplyAuthor: null,
          content: newDiscussion.content,
          replies: [],
        }
        setDiscussions((prev) => [localDiscussion, ...prev])
      }
      setNewDiscussion({ title: '', category: '', tags: '', content: '' })
      setShowCreateForm(false)
    } catch {
      // Silently fail
    } finally {
      setCreatingDiscussion(false)
    }
  }, [newDiscussion])

  const handleSubmitReply = useCallback(async () => {
    if (!replyContent.trim() || !selectedDiscussion) return
    setReplySubmitting(true)
    try {
      const token = localStorage.getItem('cp_token')
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/forum/discussions/${selectedDiscussion.id}/replies`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: replyContent }),
      })

      const newReply: Reply = {
        id: `r-${Date.now()}`,
        author: { id: 'self', name: 'Vous' },
        createdAt: new Date().toISOString(),
        content: replyContent,
        reactions: [],
        mentions: replyContent.match(/@(\S+)/g)?.map((m) => m.slice(1)) || [],
      }

      if (res.ok) {
        const data = await res.json()
        if (data.reply) Object.assign(newReply, data.reply)
      }

      setSelectedDiscussion((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          replies: [...prev.replies, newReply],
          replyCount: prev.replyCount + 1,
          lastReplyAt: newReply.createdAt,
          lastReplyAuthor: newReply.author,
        }
      })
      setDiscussions((prev) => prev.map((d) =>
        d.id === selectedDiscussion.id
          ? { ...d, replyCount: d.replyCount + 1, lastReplyAt: newReply.createdAt, lastReplyAuthor: newReply.author }
          : d
      ))
      setReplyContent('')
    } catch {
      // Silently fail
    } finally {
      setReplySubmitting(false)
    }
  }, [replyContent, selectedDiscussion])

  const handleMentionSelect = useCallback((author: Author) => {
    setReplyContent((prev) => {
      const lastAt = prev.lastIndexOf('@')
      const before = prev.substring(0, lastAt)
      const after = prev.substring(lastAt)
      return `${before}@${author.name} `
    })
    setShowMentionDropdown(false)
    setMentionQuery('')
    replyRef.current?.focus()
  }, [])

  const handleReplyInputChange = useCallback((value: string) => {
    setReplyContent(value)
    const lastChar = value.slice(-1)
    const lastSpaceIndex = value.lastIndexOf(' ')
    const afterSpace = value.substring(lastSpaceIndex + 1)

    if (lastChar === '@' || (afterSpace.startsWith('@') && afterSpace.length > 1)) {
      const query = afterSpace.slice(1)
      setMentionQuery(query)
      setShowMentionDropdown(true)
    } else if (lastChar === ' ' && !afterSpace.includes('@')) {
      setShowMentionDropdown(false)
    }
  }, [])

  const toggleReaction = useCallback((discussionId: string, replyId: string, reactionType: string) => {
    setSelectedDiscussion((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        replies: prev.replies.map((r) => {
          if (r.id !== replyId) return r
          const existing = r.reactions.find((rx) => rx.type === reactionType)
          if (existing) {
            if (existing.hasReacted) {
              return { ...r, reactions: r.reactions.map((rx) => rx.type === reactionType ? { ...rx, count: Math.max(0, rx.count - 1), hasReacted: false } : rx) }
            } else {
              return { ...r, reactions: r.reactions.map((rx) => rx.type === reactionType ? { ...rx, count: rx.count + 1, hasReacted: true } : rx) }
            }
          }
          return { ...r, reactions: [...r.reactions, { type: reactionType, count: 1, hasReacted: true }] }
        }),
      }
    })
  }, [])

  // ======================== DISCUSSION DETAIL VIEW ========================

  if (selectedDiscussion) {
    const cat = getCategoryById(selectedDiscussion.category)
    return (
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-4">
        {/* Back Button */}
        <motion.div variants={fadeIn}>
          <Button variant="ghost" onClick={() => setSelectedDiscussion(null)} className="gap-2 text-gray-600 hover:text-gray-900 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Retour aux discussions
          </Button>
        </motion.div>

        {/* Discussion Header */}
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarFallback className={`rounded-xl bg-gradient-to-br ${getAuthorColor(selectedDiscussion.author.id)} text-white font-bold text-sm`}>
                    {getAuthorInitials(selectedDiscussion.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {selectedDiscussion.pinned && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] gap-1">
                        <Pin className="w-3 h-3" />Épinglé
                      </Badge>
                    )}
                    {cat && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px]">
                        <cat.icon className="w-3 h-3 mr-1" />{cat.name}
                      </Badge>
                    )}
                    {selectedDiscussion.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] text-gray-500 border-gray-200">#{tag}</Badge>
                    ))}
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mb-2">{selectedDiscussion.title}</h1>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="font-medium text-gray-700">{selectedDiscussion.author.name}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(selectedDiscussion.createdAt)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{selectedDiscussion.viewCount}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{selectedDiscussion.replyCount}</span>
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedDiscussion.content}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Replies */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-indigo-500" />
            {selectedDiscussion.replies.length} réponse(s)
          </h3>
          {selectedDiscussion.replies.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Aucune réponse pour le moment. Soyez le premier à répondre !</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div variants={staggerContainer} className="space-y-3">
              {selectedDiscussion.replies.map((reply) => (
                <motion.div key={reply.id} variants={fadeIn}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className={`rounded-lg bg-gradient-to-br ${getAuthorColor(reply.author.id)} text-white text-xs font-bold`}>
                            {getAuthorInitials(reply.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-gray-900">{reply.author.name}</span>
                            <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            {reply.content.split(/(@\S+)/g).map((part, i) =>
                              part.startsWith('@') ? (
                                <span key={i} className="text-indigo-600 font-medium hover:underline cursor-pointer">{part}</span>
                              ) : (
                                <span key={i}>{part}</span>
                              )
                            )}
                          </div>
                          {/* Reactions */}
                          <div className="flex items-center gap-2 mt-3">
                            {REACTION_TYPES.map((rt) => {
                              const reaction = reply.reactions.find((rx) => rx.type === rt.id)
                              const RIcon = rt.icon
                              return (
                                <button
                                  key={rt.id}
                                  onClick={() => toggleReaction(selectedDiscussion.id, reply.id, rt.id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                                    reaction?.hasReacted
                                      ? 'bg-indigo-100 text-indigo-700'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                >
                                  <RIcon className={`w-3 h-3 ${reaction?.hasReacted ? 'fill-indigo-500 text-indigo-500' : ''}`} />
                                  {reaction && reaction.count > 0 && reaction.count}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Reply Input */}
        <motion.div variants={fadeIn}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Textarea
                  ref={replyRef}
                  value={replyContent}
                  onChange={(e) => handleReplyInputChange(e.target.value)}
                  placeholder="Écrivez votre réponse... Utilisez @ pour mentionner un membre"
                  className="rounded-xl border-gray-200 min-h-[100px] pr-12 resize-none"
                />
                <Button
                  onClick={handleSubmitReply}
                  disabled={replySubmitting || !replyContent.trim()}
                  size="sm"
                  className="absolute bottom-3 right-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {replySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>

              {/* Mention Dropdown */}
              <AnimatePresence>
                {showMentionDropdown && (
                  <motion.div
                    ref={mentionRef}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden"
                  >
                    <div className="p-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-500 px-2">Mentionner un membre</p>
                    </div>
                    <ScrollArea className="max-h-48">
                      {filteredMentions.length === 0 ? (
                        <p className="text-xs text-gray-400 p-3 text-center">Aucun membre trouvé</p>
                      ) : (
                        filteredMentions.map((author) => (
                          <button
                            key={author.id}
                            onClick={() => handleMentionSelect(author)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                          >
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className={`rounded-lg bg-gradient-to-br ${getAuthorColor(author.id)} text-white text-[10px] font-bold`}>
                                {getAuthorInitials(author.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-700">{author.name}</span>
                          </button>
                        ))
                      )}
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  // ======================== MAIN FORUM VIEW ========================

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
      {/* Page Header */}
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Forum</h1>
            <p className="text-sm text-gray-500">Échangez avec la communauté entrepreneuriale</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-4 h-4" />
            <Filter className="w-4 h-4 ml-1" />
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nouvelle discussion
          </Button>
        </div>
      </motion.div>

      <div className="flex gap-6">
        {/* Categories Sidebar */}
        <aside className={`shrink-0 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden transition-all duration-300 hidden sm:block`}>
          <Card className="border-0 shadow-sm sticky top-24">
            <CardContent className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Catégories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="flex-1 text-left">Toutes</span>
                  <span className="text-xs text-gray-400">{discussions.length}</span>
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? '' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left">{cat.name}</span>
                    <span className="text-xs text-gray-400">{cat.discussionCount}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Mobile Category Selector */}
        <div className="sm:hidden w-full">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="rounded-xl border-gray-200">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name} ({cat.discussionCount})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <motion.div variants={fadeIn} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une discussion, un tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="animate-pulse space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-gray-200" />
                          <div className="h-3 w-1/3 rounded bg-gray-200" />
                        </div>
                      </div>
                      <div className="h-3 w-full rounded bg-gray-200" />
                      <div className="flex gap-4">
                        <div className="h-3 w-16 rounded bg-gray-200" />
                        <div className="h-3 w-16 rounded bg-gray-200" />
                        <div className="h-3 w-16 rounded bg-gray-200" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <motion.div variants={fadeIn}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune discussion</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    {searchQuery
                      ? 'Aucune discussion ne correspond à votre recherche.'
                      : `Aucune discussion dans la catégorie "${getCategoryById(selectedCategory)?.name || 'sélectionnée'}".`}
                  </p>
                  <Button onClick={() => setShowCreateForm(true)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Créer la première discussion
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} className="space-y-3">
              {/* Pinned Discussions */}
              {pinnedDiscussions.length > 0 && (
                <div className="space-y-3">
                  {pinnedDiscussions.map((discussion) => (
                    <DiscussionCard
                      key={discussion.id}
                      discussion={discussion}
                      category={getCategoryById(discussion.category)}
                      onClick={() => setSelectedDiscussion(discussion)}
                    />
                  ))}
                  {regularDiscussions.length > 0 && <Separator />}
                </div>
              )}

              {/* Regular Discussions */}
              {regularDiscussions.map((discussion) => (
                <DiscussionCard
                  key={discussion.id}
                  discussion={discussion}
                  category={getCategoryById(discussion.category)}
                  onClick={() => setSelectedDiscussion(discussion)}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Create Discussion Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-500" />
                  Nouvelle discussion
                </h2>
                <button onClick={() => setShowCreateForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="disc-title" className="text-sm font-medium text-gray-700">
                    Titre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="disc-title"
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de votre discussion"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Catégorie <span className="text-red-500">*</span></Label>
                  <Select
                    value={newDiscussion.category}
                    onValueChange={(v) => setNewDiscussion((prev) => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tags</Label>
                  <Input
                    value={newDiscussion.tags}
                    onChange={(e) => setNewDiscussion((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="ex: Financement, Startup, Tech (séparés par des virgules)"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Contenu <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={newDiscussion.content}
                    onChange={(e) => setNewDiscussion((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Décrivez votre question ou votre sujet en détail..."
                    className="rounded-xl border-gray-200 min-h-[160px] resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-xl"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateDiscussion}
                  disabled={creatingDiscussion || !newDiscussion.title.trim() || !newDiscussion.category || !newDiscussion.content.trim()}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {creatingDiscussion ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Publier
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ======================== DISCUSSION CARD SUBCOMPONENT ========================

function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  )
}

function DiscussionCard({
  discussion,
  category,
  onClick,
}: {
  discussion: Discussion
  category: ForumCategory | undefined
  onClick: () => void
}) {
  return (
    <motion.div variants={fadeIn} whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
      <Card
        className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        onClick={onClick}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback className={`rounded-xl bg-gradient-to-br ${getAuthorColor(discussion.author.id)} text-white text-xs font-bold`}>
                {getAuthorInitials(discussion.author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {discussion.pinned && (
                  <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {discussion.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {category && (
                  <Badge variant="secondary" className={`text-[10px] gap-1 ${category.color} bg-gray-50`}>
                    <category.icon className="w-3 h-3" />{category.name}
                  </Badge>
                )}
                {discussion.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] text-gray-400 border-gray-200">#{tag}</Badge>
                ))}
                {discussion.tags.length > 3 && (
                  <span className="text-[10px] text-gray-400">+{discussion.tags.length - 3}</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-600">{discussion.author.name}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatDate(discussion.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1" title="Réponses">
                    <MessageCircle className="w-3 h-3" />{discussion.replyCount}
                  </span>
                  <span className="flex items-center gap-1" title="Vues">
                    <Eye className="w-3 h-3" />{discussion.viewCount}
                  </span>
                </div>
              </div>
              {discussion.lastReplyAuthor && (
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Dernière réponse par <span className="font-medium text-gray-500">{discussion.lastReplyAuthor.name}</span>
                  {discussion.lastReplyAt && <> · {formatDate(discussion.lastReplyAt)}</>}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
