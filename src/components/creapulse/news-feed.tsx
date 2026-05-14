'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Share2,
  ExternalLink,
  Newspaper,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Filter,
  ChevronDown,
  X,
  Eye,
  Clock,
  Loader2,
} from 'lucide-react'

// ==================== TYPES ====================
type NewsType = 'article' | 'event' | 'opportunity' | 'training' | 'actualite'

interface NewsItem {
  id: string
  type: NewsType
  title: string
  excerpt: string
  content?: string
  image: string
  source: string
  date: string
  sector?: string
  readTime?: string
  saved: boolean
  url?: string
}

// ==================== CONSTANTS ====================
const TYPE_CONFIG: Record<NewsType, { icon: typeof Newspaper; color: string; bgColor: string; label: string }> = {
  article: { icon: Newspaper, color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'Article' },
  event: { icon: Calendar, color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Événement' },
  opportunity: { icon: Briefcase, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Opportunité' },
  training: { icon: GraduationCap, color: 'text-sky-600', bgColor: 'bg-sky-50', label: 'Formation' },
  actualite: { icon: TrendingUp, color: 'text-violet-600', bgColor: 'bg-violet-50', label: 'Actualité' },
}

const FILTER_TABS = [
  { value: 'all', label: 'Tous' },
  { value: 'article', label: 'Articles' },
  { value: 'event', label: 'Événements' },
  { value: 'opportunity', label: 'Opportunités' },
  { value: 'training', label: 'Formations' },
  { value: 'actualite', label: 'Actualités' },
] as const

type FilterTab = (typeof FILTER_TABS)[number]['value']

const SECTORS = [
  'Tous les secteurs',
  'Tech & Digital',
  'Commerce',
  'Social & Solidarité',
  'Industrie',
  'Environnement',
  'Santé',
  'Tourisme',
]

const EMPTY_MESSAGES: Record<string, string> = {
  all: 'Aucun article disponible pour le moment.',
  article: 'Aucun article trouvé.',
  event: 'Aucun événement à venir.',
  opportunity: 'Aucune opportunité disponible.',
  training: 'Aucune formation trouvée.',
  actualite: 'Aucune actualité récente.',
}

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ==================== ANIMATIONS ====================
const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.04 } },
}

// ==================== NEWS CARD ====================
function NewsCard({
  item,
  onSave,
  onOpen,
}: {
  item: NewsItem
  onSave: (id: string) => void
  onOpen: (item: NewsItem) => void
}) {
  const config = TYPE_CONFIG[item.type]
  const Icon = config.icon

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
    >
      <div className="relative">
        <div className="aspect-[16/9] bg-gradient-to-br from-indigo-100 via-sky-50 to-violet-100 overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        </div>
        <div className="absolute top-3 left-3">
          <Badge className={`${config.bgColor} ${config.color} border-0 text-[10px] font-medium px-2 py-0.5 shadow-sm`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onSave(item.id) }}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            {item.saved ? (
              <BookmarkCheck className="w-4 h-4 text-indigo-600" />
            ) : (
              <Bookmark className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (navigator.share) {
                navigator.share({ title: item.title, text: item.excerpt })
              }
            }}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Share2 className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
          </button>
        </div>
      </div>

      <CardContent className="p-4" onClick={() => onOpen(item)} role="button" tabIndex={0}>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-indigo-700 transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span>{item.source}</span>
            <span>·</span>
            <span>{formatDate(item.date)}</span>
            {item.readTime && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {item.readTime}
                </span>
              </>
            )}
          </div>
        </div>
        {item.sector && (
          <Badge variant="secondary" className="mt-2 text-[10px] px-2 py-0 bg-gray-50 text-gray-600 border-0">
            {item.sector}
          </Badge>
        )}
      </CardContent>
    </motion.div>
  )
}

// ==================== NEWS DETAIL MODAL ====================
function NewsDetailModal({
  item,
  open,
  onClose,
  onSave,
  onHide,
}: {
  item: NewsItem | null
  open: boolean
  onClose: () => void
  onSave: (id: string) => void
  onHide: (id: string) => void
}) {
  if (!item) return null

  const config = TYPE_CONFIG[item.type]
  const Icon = config.icon

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: item.title, text: item.excerpt })
    } else {
      navigator.clipboard.writeText(item.title + ' — ' + item.excerpt)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] rounded-2xl p-0 overflow-hidden">
        <div className="relative">
          <div className="aspect-[16/8] bg-gradient-to-br from-indigo-100 via-sky-50 to-violet-100 overflow-hidden">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-sm"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <ScrollArea className="max-h-[50vh]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`${config.bgColor} ${config.color} border-0 text-xs px-2.5 py-0.5`}>
                <Icon className="w-3.5 h-3.5 mr-1" />
                {config.label}
              </Badge>
              {item.sector && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">{item.sector}</Badge>
              )}
            </div>

            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">{item.title}</DialogTitle>

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
              <span className="font-medium">{item.source}</span>
              <span>·</span>
              <span>{formatDate(item.date)}</span>
              {item.readTime && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.readTime}</span>
                </>
              )}
            </div>

            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
              {item.content ? (
                item.content.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))
              ) : (
                <>
                  <p>{item.excerpt}</p>
                  <p className="text-sm text-gray-500 italic">Contenu complet disponible en cliquant sur le lien source.</p>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
              <Button
                onClick={() => onSave(item.id)}
                variant={item.saved ? 'default' : 'outline'}
                className={`rounded-xl text-xs ${item.saved ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}
              >
                {item.saved ? <BookmarkCheck className="w-3.5 h-3.5 mr-1.5" /> : <Bookmark className="w-3.5 h-3.5 mr-1.5" />}
                {item.saved ? 'Sauvegardé' : 'Sauvegarder'}
              </Button>
              <Button onClick={handleShare} variant="outline" className="rounded-xl text-xs border-gray-200">
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Partager
              </Button>
              <div className="flex-1" />
              <Button
                onClick={() => { onHide(item.id); onClose() }}
                variant="ghost"
                className="rounded-xl text-xs text-gray-400 hover:text-red-500"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Masquer
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ==================== MOCK DATA ====================
function getMockNews(): NewsItem[] {
  return [
    {
      id: '1', type: 'article', title: 'Comment créer son business plan étape par étape',
      excerpt: 'Un guide complet pour structurer votre business plan et convaincre vos futurs investisseurs. Découvrez les 10 sections incontournables.',
      content: 'Créer un business plan est une étape cruciale pour tout entrepreneur.\n\nLe résumé opérationnel est la première impression que vous donnez. Il doit résumer votre projet en 2 pages maximum.\n\nL\'étude de marché vous permet de valider la demande existante et d\'analyser votre concurrence.\n\nLa stratégie marketing définit comment vous allez acquérir vos premiers clients.\n\nLes prévisions financières montrent la viabilité économique de votre projet sur 3 à 5 ans.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
      source: 'Entreprendre.fr', date: '2025-01-18', readTime: '5 min', saved: false, sector: 'Business',
    },
    {
      id: '2', type: 'event', title: 'Salon de l\'Entrepreneuriat — Paris 2025',
      excerpt: 'Le plus grand salon de l\'entrepreneuriat en France. Rencontres, ateliers et conférences pendant 3 jours.',
      content: 'Rejoignez-nous au Palais des Congrès pour le Salon de l\'Entrepreneuriat 2025.\n\nPlus de 200 exposants, 50 ateliers pratiques et 30 conférences animées par des entrepreneurs à succès.\n\nDates : 15-17 mars 2025\nLieu : Palais des Congrès, Paris\nEntrée gratuite sur inscription.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
      source: 'Bpifrance', date: '2025-02-15', saved: false, sector: 'Événement',
    },
    {
      id: '3', type: 'opportunity', title: 'Appel à projets : French Tech 2025',
      excerpt: 'Bpifrance lance un nouvel appel à projets pour les startups innovantes. Subventions jusqu\'à 50 000€.',
      content: 'L\'appel à projets French Tech 2025 est ouvert aux startups en phase de croissance.\n\nCritères d\'éligibilité : moins de 5 ans d\'existence, basée en France, innovation technologique.\n\nMontant : jusqu\'à 50 000€ de subvention non dilutive.\n\nDate limite de candidature : 30 avril 2025.',
      image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop',
      source: 'French Tech', date: '2025-01-20', saved: false, sector: 'Tech & Digital',
    },
    {
      id: '4', type: 'training', title: 'Formation : Comprendre la comptabilité pour entrepreneurs',
      excerpt: 'Formation en ligne de 20 heures pour maîtriser les bases de la comptabilité et gérer votre trésorerie.',
      content: 'Cette formation en ligne vous donnera les compétences nécessaires pour gérer la comptabilité de votre entreprise.\n\nProgramme : Bilan, compte de résultat, trésorerie, TVA, fiscalité.\n\nDurée : 20 heures réparties sur 4 semaines.\n\nCertificat de fin de formation délivré.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
      source: 'Udemy Business', date: '2025-01-12', readTime: '3 min', saved: true, sector: 'Formation',
    },
    {
      id: '5', type: 'actualite', title: 'Nouvelles aides à la création d\'entreprise en 2025',
      excerpt: 'Le gouvernement annonce de nouvelles mesures pour soutenir la création d\'entreprise : exonérations, prêts et accompagnement renforcé.',
      content: 'Les nouvelles mesures pour 2025 incluent :\n\n- L\'ACRE étendue à 3 ans\n- Le micro-crédit porté à 12 000€\n- Un nouveau dispositif d\'accompagnement renforcé\n- Des exonérations de charges sociales supplémentaires\n\nCes mesures entrent en vigueur au 1er janvier 2025.',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=400&fit=crop',
      source: 'Service-Public.fr', date: '2025-01-10', readTime: '4 min', saved: false, sector: 'Institutionnel',
    },
    {
      id: '6', type: 'article', title: 'Les tendances du e-commerce en 2025',
      excerpt: 'Découvrez les 5 grandes tendances qui vont transformer le commerce en ligne cette année.',
      content: 'Le e-commerce continue d\'évoluer rapidement. Voici les tendances clés de 2025 :\n\n1. Le social commerce s\'impose comme canal d\'acquisition principal.\n2. L\'IA générative transforme l\'expérience client.\n3. Le commerce durable gagne du terrain.\n4. Les marketplaces spécialisées croissent.\n5. Le phygital (physique + digital) redéfinit la vente.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
      source: 'Maddyness', date: '2025-01-08', readTime: '6 min', saved: false, sector: 'Commerce',
    },
  ]
}

// ==================== MAIN COMPONENT ====================
export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [savedNews, setSavedNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [activeSector, setActiveSector] = useState('Tous les secteurs')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  const [visibleCount, setVisibleCount] = useState(6)
  const [detailItem, setDetailItem] = useState<NewsItem | null>(null)
  const [showSectorFilter, setShowSectorFilter] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    const load = async () => {
      const newsData = await fetchJson<NewsItem[]>('/api/news', [])
      const mockNews = getMockNews()
      setNews(newsData.length > 0 ? newsData : mockNews)
      const savedData = await fetchJson<NewsItem[]>('/api/news/saved', [])
      if (savedData.length > 0) {
        setSavedNews(savedData)
        const savedIds = new Set(savedData.map((s) => s.id))
        setNews((prev) => prev.map((n) => (savedIds.has(n.id) ? { ...n, saved: true } : n)))
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = useCallback(async (id: string) => {
    await fetchJson(`/api/news/${id}/save`, null, { method: 'POST' })
    setNews((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = { ...n, saved: !n.saved }
          if (updated.saved) {
            setSavedNews((s) => [...s, updated])
          } else {
            setSavedNews((s) => s.filter((sn) => sn.id !== id))
          }
          return updated
        }
        return n
      })
    )
  }, [])

  const handleHide = useCallback(async (id: string) => {
    setNews((prev) => prev.filter((n) => n.id !== id))
    setSavedNews((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const filteredNews = (showSaved ? savedNews : news).filter((n) => {
    if (activeFilter !== 'all' && n.type !== activeFilter) return false
    if (activeSector !== 'Tous les secteurs' && n.sector !== activeSector) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q)
    }
    return true
  })

  const displayNews = filteredNews.slice(0, visibleCount)
  const hasMore = visibleCount < filteredNews.length
  const recommendedNews = news.filter((n) => n.type === 'opportunity' || n.type === 'training').slice(0, 3)

  const loadMore = () => {
    setVisibleCount((prev) => prev + 6)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          {/* Header */}
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fil d&apos;actualités</h1>
              <p className="text-sm text-gray-500 mt-1">
                Restez informé des dernières tendances et opportunités.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showSaved ? 'default' : 'outline'}
                onClick={() => setShowSaved(!showSaved)}
                className={`rounded-xl text-xs h-9 ${showSaved ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600'}`}
              >
                {showSaved ? <BookmarkCheck className="w-3.5 h-3.5 mr-1.5" /> : <Bookmark className="w-3.5 h-3.5 mr-1.5" />}
                {showSaved ? 'Sauvegardés' : 'Actualités'}
                {savedNews.length > 0 && !showSaved && (
                  <Badge className="ml-1.5 bg-indigo-100 text-indigo-700 text-[9px] px-1 py-0 h-4">{savedNews.length}</Badge>
                )}
              </Button>
            </div>
          </motion.div>

          {/* "Pour vous" section */}
          {!showSaved && !searchQuery && activeFilter === 'all' && activeSector === 'Tous les secteurs' && (
            <motion.div variants={fadeIn}>
              <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 via-white to-sky-50 border border-indigo-100/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-900">Pour vous</h2>
                    <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700 border-0">Recommandations</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {recommendedNews.map((item) => {
                      const config = TYPE_CONFIG[item.type]
                      const Icon = config.icon
                      return (
                        <motion.button
                          key={item.id}
                          whileHover={{ y: -2 }}
                          onClick={() => setDetailItem(item)}
                          className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all text-left"
                        >
                          <div className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{item.source} · {formatDate(item.date)}</p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div variants={fadeIn} className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Tabs value={activeFilter} onValueChange={(v) => { setActiveFilter(v as FilterTab); setVisibleCount(6) }}>
                <TabsList className="bg-gray-100 rounded-xl h-9 p-1">
                  {FILTER_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-lg text-[11px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-2.5"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className="rounded-xl text-xs h-8 border-gray-200"
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                Rechercher
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSectorFilter(!showSectorFilter)}
                  className={`rounded-xl text-xs h-8 ${activeSector !== 'Tous les secteurs' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-gray-200'}`}
                >
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  {activeSector !== 'Tous les secteurs' ? activeSector : 'Secteur'}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un article..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(6) }}
                      className="pl-9 h-10 rounded-xl border-gray-200 bg-white text-sm"
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSectorFilter && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-1.5"
                >
                  {SECTORS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setActiveSector(s); setVisibleCount(6) }}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                        activeSector === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* News Grid */}
          <motion.div variants={fadeIn}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="aspect-[16/9] bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    {showSaved ? (
                      <Bookmark className="w-7 h-7 text-gray-400" />
                    ) : (
                      <Newspaper className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    {showSaved ? 'Aucun article sauvegardé' : (EMPTY_MESSAGES[activeFilter] || 'Aucun résultat')}
                  </h3>
                  <p className="text-xs text-gray-400 text-center max-w-xs">
                    {showSaved
                      ? 'Sauvegardez des articles pour les retrouver facilement ici.'
                      : searchQuery ? 'Essayez avec d\'autres termes de recherche.' : 'Revenez plus tard pour découvrir du nouveau contenu.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayNews.map((item) => (
                    <NewsCard key={item.id} item={item} onSave={handleSave} onOpen={setDetailItem} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      className="rounded-xl text-sm border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                    >
                      <ChevronDown className="w-4 h-4 mr-1.5" />
                      Charger plus
                      <span className="ml-1.5 text-gray-400">({filteredNews.length - visibleCount} restants)</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      <NewsDetailModal
        item={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        onSave={handleSave}
        onHide={handleHide}
      />
    </div>
  )
}
