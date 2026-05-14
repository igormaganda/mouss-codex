'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  MapPin,
  Globe,
  Phone,
  Heart,
  ExternalLink,
  Users,
  Building2,
  TrendingUp,
  Star,
  ChevronDown,
  Loader2,
  MessageCircle,
  Briefcase,
  GraduationCap,
  Landmark,
  Rocket,
  Handshake,
  Award,
  Filter,
  X,
} from 'lucide-react'

// ======================== TYPES ========================

interface Actor {
  id: string
  name: string
  type: 'CCI' | 'CMA' | 'Incubateur' | 'Accélérateur' | 'BGE' | 'Réseau' | 'Pépinière' | 'Financement'
  description: string
  city: string
  region: string
  services: string[]
  successRate: number
  projectsCount: number
  featured: boolean
  website: string
  contactEmail: string
  logo?: string
}

interface Network {
  id: string
  name: string
  description: string
  memberCount: number
  region: string
  icon: React.ElementType
  color: string
}

type ActorType = Actor['type']

// ======================== CONSTANTS ========================

const TYPE_CONFIG: Record<ActorType, { label: string; color: string; bg: string; border: string }> = {
  CCI: { label: 'CCI', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200' },
  CMA: { label: 'CMA', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' },
  Incubateur: { label: 'Incubateur', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-200' },
  Accélérateur: { label: 'Accélérateur', color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200' },
  BGE: { label: 'BGE', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  Réseau: { label: 'Réseau', color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-200' },
  Pépinière: { label: 'Pépinière', color: 'text-teal-700', bg: 'bg-teal-100', border: 'border-teal-200' },
  Financement: { label: 'Financement', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200' },
}

const REGIONS = [
  'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne',
  'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France',
  'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
  'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur', 'DOM-TOM',
]

const ACTOR_TYPES: ActorType[] = ['CCI', 'CMA', 'Incubateur', 'Accélérateur', 'BGE', 'Réseau', 'Pépinière', 'Financement']

const MOCK_ACTORS: Actor[] = [
  {
    id: '1', name: 'CCI Paris Île-de-France', type: 'CCI',
    description: 'La CCI Paris Île-de-France accompagne les créateurs et repreneurs d\'entreprises dans leur parcours entrepreneurial. Elle offre des services de conseil, de formation et de mise en réseau pour favoriser le développement des activités économiques en région parisienne.',
    city: 'Paris', region: 'Île-de-France',
    services: ['Création d\'entreprise', 'Formation', 'Réseautage', 'Conseil juridique'],
    successRate: 87, projectsCount: 1240, featured: true,
    website: 'https://www.cci-paris-idf.fr', contactEmail: 'contact@cci-paris-idf.fr',
  },
  {
    id: '2', name: 'Incubateur Agoranov', type: 'Incubateur',
    description: 'Agoranov est l\'incubateur de projets innovants en Île-de-France, dédié aux startups issues de la recherche publique. Il accompagne les porteurs de projets dans les phases de validation, prototypage et premières levées de fonds.',
    city: 'Paris', region: 'Île-de-France',
    services: ['Incubation', 'Mentorat', 'Financement', 'Prototypage'],
    successRate: 92, projectsCount: 580, featured: true,
    website: 'https://www.agoranov.com', contactEmail: 'info@agoranov.com',
  },
  {
    id: '3', name: 'BGE Rhône-Alpes', type: 'BGE',
    description: 'Boutique de Gestion des Entreprises en Rhône-Alpes. Accompagnement personnalisé des créateurs d\'entreprise avec un réseau de 120 conseillers sur tout le territoire.',
    city: 'Lyon', region: 'Auvergne-Rhône-Alpes',
    services: ['Coaching individuel', 'Ateliers collectifs', 'Microcrédit'],
    successRate: 78, projectsCount: 920, featured: false,
    website: 'https://www.bge.fr', contactEmail: 'lyon@bge.fr',
  },
  {
    id: '4', name: 'CMA Grand Est', type: 'CMA',
    description: 'La Chambre de Métiers et de l\'Artisanat du Grand Est soutient les artisans dans leurs projets de création, transmission et développement d\'activités artisanales.',
    city: 'Strasbourg', region: 'Grand Est',
    services: ['Artisanat', 'Formation professionnelle', 'Qualification'],
    successRate: 81, projectsCount: 450, featured: false,
    website: 'https://www.cma-grandest.fr', contactEmail: 'contact@cma-grandest.fr',
  },
  {
    id: '5', name: 'Station F', type: 'Accélérateur',
    description: 'Le plus grand campus de startups au monde, situé à Paris. Station F héberge plus de 1000 startups et offre des programmes d\'accélération en partenariat avec les leaders tech mondiaux.',
    city: 'Paris', region: 'Île-de-France',
    services: ['Accélération', 'Hébergement', 'Événements', 'Mentorat'],
    successRate: 95, projectsCount: 2100, featured: true,
    website: 'https://stationf.co', contactEmail: 'hello@stationf.co',
  },
  {
    id: '6', name: 'Réseau Entreprendre Bretagne', type: 'Réseau',
    description: 'Réseau de chefs d\'entreprise bénévoles qui accompagnent les créateurs par le prêt d\'honneur et le mentorat. Fort de 500 entrepreneurs engrenés en Bretagne.',
    city: 'Rennes', region: 'Bretagne',
    services: ['Prêt d\'honneur', 'Mentorat', 'Mise en réseau'],
    successRate: 84, projectsCount: 380, featured: false,
    website: 'https://www.reseau-entreprendre.org', contactEmail: 'bretagne@reseau-entreprendre.org',
  },
  {
    id: '7', name: 'Pépinière Eurêka', type: 'Pépinière',
    description: 'Pépinière d\'entreprises innovantes à Toulouse. Hébergement, accompagnement et services mutualisés pour les startups en phase de lancement sur le marché occitan.',
    city: 'Toulouse', region: 'Occitanie',
    services: ['Hébergement', 'Coworking', 'Accompagnement'],
    successRate: 76, projectsCount: 210, featured: false,
    website: 'https://www.pepiniere-eureka.fr', contactEmail: 'contact@pepiniere-eureka.fr',
  },
  {
    id: '8', name: 'Bpifrance Création', type: 'Financement',
    description: 'Bpifrance accompagne les créateurs d\'entreprise avec des solutions de financement adaptées : prêt d\'amorçage, garantie, subventions. Partenaire incontournable du financement de la création en France.',
    city: 'Paris', region: 'Île-de-France',
    services: ['Prêt d\'amorçage', 'Garantie bancaire', 'Subventions', 'Investissement'],
    successRate: 89, projectsCount: 3400, featured: true,
    website: 'https://www.bpifrance.fr', contactEmail: 'creation@bpifrance.fr',
  },
  {
    id: '9', name: 'CCI Lyon Métropole', type: 'CCI',
    description: 'La CCI de Lyon Métropole propose un accompagnement complet pour les entrepreneurs du territoire : informations, formations, conseils juridiques et financements.',
    city: 'Lyon', region: 'Auvergne-Rhône-Alpes',
    services: ['Conseil', 'Formation', 'International', 'Numérique'],
    successRate: 83, projectsCount: 760, featured: false,
    website: 'https://www.cci-lyon.com', contactEmail: 'info@cci-lyon.com',
  },
  {
    id: '10', name: 'Incubateur PACA-Est', type: 'Incubateur',
    description: 'Incubateur régional qui accompagne les projets innovants dans les technologies de la santé, de l\'environnement et du numérique sur la Côte d\'Azur.',
    city: 'Nice', region: 'Provence-Alpes-Côte d\'Azur',
    services: ['Incubation', 'Recherche partenariale', 'Valorisation'],
    successRate: 79, projectsCount: 145, featured: false,
    website: 'https://www.incubateur-paca-est.fr', contactEmail: 'contact@incubateur-paca-est.fr',
  },
  {
    id: '11', name: 'CMA Provence', type: 'CMA',
    description: 'La CMA de Provence accompagne les artisans de la région avec des dispositifs spécifiques pour le développement des métiers d\'art, du bâtiment et des services de proximité.',
    city: 'Marseille', region: 'Provence-Alpes-Côte d\'Azur',
    services: ['Artisanat', 'Apprentissage', 'Transmission'],
    successRate: 74, projectsCount: 310, featured: false,
    website: 'https://www.cma-provence.fr', contactEmail: 'marseille@cma-provence.fr',
  },
  {
    id: '12', name: 'French Tech Nantes', type: 'Accélérateur',
    description: 'Le programme French Tech de Nantes accélère les startups du Grand Ouest avec un focus sur le numérique, la santé et la transition écologique.',
    city: 'Nantes', region: 'Pays de la Loire',
    services: ['Accélération', 'Visibilité', 'Networking', 'Fundraising'],
    successRate: 88, projectsCount: 280, featured: false,
    website: 'https://www.frenchtech-nantes.fr', contactEmail: 'contact@frenchtech-nantes.fr',
  },
]

const MOCK_NETWORKS: Network[] = [
  { id: 'n1', name: 'Réseau Entreprendre', description: 'Réseau national de chefs d\'entreprise bénévoles accompagnant les créateurs par le prêt d\'honneur et le mentorat.', memberCount: 12000, region: 'National', icon: Handshake, color: 'from-indigo-500 to-blue-600' },
  { id: 'n2', name: 'French Tech', description: 'Écosystème fédérateur des startups françaises, avec des programmes d\'accélération et de visibilité internationale.', memberCount: 25000, region: 'National', icon: Rocket, color: 'from-rose-500 to-pink-600' },
  { id: 'n3', name: 'Initiative France', description: 'Réseau de 214 plates-formes d\'initiative locale qui accompagnent la création d\'entreprise dans chaque territoire.', memberCount: 8000, region: 'National', icon: Building2, color: 'from-emerald-500 to-teal-600' },
  { id: 'n4', name: 'Les Pépites', description: 'Réseau des pépinières d\'entreprises publiques en France, offrant locaux et accompagnement aux jeunes entreprises.', memberCount: 5000, region: 'National', icon: GraduationCap, color: 'from-amber-500 to-orange-600' },
]

const FAQ_ITEMS = [
  {
    question: 'CCI ou CMA ?',
    answer: 'La CCI (Chambre de Commerce et d\'Industrie) accompagne principalement les activités commerciales, de services et industrielles. La CMA (Chambre de Métiers et de l\'Artisanat) est spécialisée dans les métiers artisanaux (bâtiment, alimentation, métiers d\'art...). Si votre projet relève de l\'artisanat ou nécessite une qualification professionnelle artisanale, la CMA est votre interlocuteur. Pour les activités commerciales, services aux entreprises ou industrie, privilégiez la CCI. Dans tous les cas, certaines CCI et CMA proposent des partenariats pour les projets mixtes.',
  },
  {
    question: 'Incubateur ou Accélérateur ?',
    answer: 'L\'incubateur est destiné aux projets en amont de la création (idées, prototypes, validation de marché). L\'hébergement y est généralement de 1 à 3 ans avec un accompagnement intensif. L\'accélérateur s\'adresse aux startups déjà créées qui cherchent à accélérer leur croissance (business model validé, premières ventes). Les programmes d\'accélération durent généralement 3 à 6 mois et sont très orientés vers la levée de fonds et le scaling. Choisissez l\'incubateur si vous êtes en phase de conception, l\'accélérateur si vous avez déjà lancé votre activité.',
  },
  {
    question: 'Besoin de financement ?',
    answer: 'Plusieurs solutions s\'offrent à vous selon votre stade de projet : le prêt d\'honneur (Réseau Entreprendre, Initiative France) est un financement sans intérêt qui complète les apports bancaires. Bpifrance propose des prêts d\'amorçage et des garanties. Les business angels investissent en capital dans des projets innovants. Les subventions régionales et nationales (Bourse French Tech, Aide à la Création d\'Entreprise) peuvent compléter votre plan de financement. Nous vous recommandons de consulter un conseiller BGE ou CCI pour construire un plan de financement adapté à votre situation.',
  },
]

// ======================== ANIMATION VARIANTS ========================

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

// ======================== MAIN COMPONENT ========================

export default function AnnuaireActors() {
  const [actors, setActors] = useState<Actor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedTypes, setSelectedTypes] = useState<Set<ActorType>>(new Set())
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [displayCount, setDisplayCount] = useState(6)
  const ITEMS_PER_PAGE = 6

  // Fetch actors on mount
  useEffect(() => {
    let cancelled = false
    const fetchActors = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('cp_token')
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/actors', { headers })
        if (res.ok && !cancelled) {
          const data = await res.json()
          setActors(data.actors || [])
        } else if (!cancelled) {
          // Use mock data when API is not available
          setActors(MOCK_ACTORS)
        }
      } catch {
        if (!cancelled) setActors(MOCK_ACTORS)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchActors()
    return () => { cancelled = true }
  }, [])

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('annuaire-favorites')
    if (stored) {
      try { setFavorites(new Set(JSON.parse(stored))) } catch { /* ignore */ }
    }
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('annuaire-favorites', JSON.stringify([...next]))
      return next
    })
  }, [])

  const toggleTypeFilter = useCallback((type: ActorType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      setDisplayCount(ITEMS_PER_PAGE)
      return next
    })
  }, [])

  const filteredActors = useMemo(() => {
    return actors.filter((actor) => {
      const matchesSearch = searchQuery === '' ||
        actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesRegion = selectedRegion === 'all' || actor.region === selectedRegion
      const matchesType = selectedTypes.size === 0 || selectedTypes.has(actor.type)

      return matchesSearch && matchesRegion && matchesType
    })
  }, [actors, searchQuery, selectedRegion, selectedTypes])

  const visibleActors = filteredActors.slice(0, displayCount)
  const hasMore = displayCount < filteredActors.length
  const activeFilterCount = selectedTypes.size + (selectedRegion !== 'all' ? 1 : 0) + (searchQuery !== '' ? 1 : 0)

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedRegion('all')
    setSelectedTypes(new Set())
    setDisplayCount(ITEMS_PER_PAGE)
  }, [])

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8">
      {/* Page Header */}
      <motion.div variants={fadeIn}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              Annuaire des Acteurs
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Retrouvez les organismes, incubateurs et réseaux d&apos;accompagnement près de chez vous.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-indigo-600">{filteredActors.length}</span> acteur(s) trouvé(s)
          </div>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un acteur, un service, une ville..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setDisplayCount(ITEMS_PER_PAGE) }}
                className="pl-10 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Region Dropdown */}
              <Select value={selectedRegion} onValueChange={(v) => { setSelectedRegion(v); setDisplayCount(ITEMS_PER_PAGE) }}>
                <SelectTrigger className="w-full sm:w-64 rounded-xl border-gray-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <SelectValue placeholder="Toutes les régions" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Active Filters Badge */}
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm text-gray-500 hover:text-red-500">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Effacer les filtres ({activeFilterCount})
                </Button>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1 mr-1 self-center">
                <Filter className="w-3.5 h-3.5" /> Type :
              </span>
              {ACTOR_TYPES.map((type) => {
                const config = TYPE_CONFIG[type]
                const isActive = selectedTypes.has(type)
                return (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      isActive
                        ? `${config.bg} ${config.color} ${config.border} shadow-sm`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actors Grid */}
      <motion.div variants={staggerContainer}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="animate-pulse flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-gray-200" />
                    <div className="h-3 w-5/6 rounded bg-gray-200" />
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-gray-200" />
                    <div className="h-6 w-16 rounded-full bg-gray-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredActors.length === 0 ? (
          <motion.div variants={fadeIn}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun acteur trouvé</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Essayez de modifier vos critères de recherche ou d&apos;élargir la zone géographique.
                </p>
                <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {visibleActors.map((actor, index) => {
                  const typeConfig = TYPE_CONFIG[actor.type]
                  const isFav = favorites.has(actor.id)
                  return (
                    <motion.div
                      key={actor.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                    >
                      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        {actor.featured && (
                          <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-900 text-amber-900" />
                            Recommandé
                          </div>
                        )}
                        <CardContent className="p-5">
                          {/* Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-12 h-12 shrink-0">
                              <AvatarFallback className={`rounded-xl ${typeConfig.bg} ${typeConfig.color} text-sm font-bold`}>
                                {actor.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                {actor.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className={`text-[10px] font-semibold px-2 py-0 ${typeConfig.bg} ${typeConfig.color} border ${typeConfig.border}`}>
                                  {typeConfig.label}
                                </Badge>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />{actor.city}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">
                            {actor.description}
                          </p>

                          {/* Services Badges */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {actor.services.slice(0, 3).map((service) => (
                              <Badge key={service} variant="outline" className="text-[10px] px-2 py-0 border-gray-200 text-gray-500 font-normal">
                                {service}
                              </Badge>
                            ))}
                            {actor.services.length > 3 && (
                              <span className="text-[10px] text-gray-400 self-center">+{actor.services.length - 3}</span>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                              <div>
                                <p className="text-xs font-bold text-gray-900">{actor.successRate}%</p>
                                <p className="text-[10px] text-gray-400">Taux de réussite</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                              <div>
                                <p className="text-xs font-bold text-gray-900">{actor.projectsCount}</p>
                                <p className="text-[10px] text-gray-400">Projets suivis</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                            <a
                              href={actor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />Site web
                            </a>
                            <a
                              href={`mailto:${actor.contactEmail}`}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />Contacter
                            </a>
                            <button
                              onClick={() => toggleFavorite(actor.id)}
                              className={`p-2 rounded-lg transition-colors ${isFav ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:text-red-400 hover:bg-red-50'}`}
                            >
                              <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Load More */}
            {hasMore && (
              <motion.div variants={fadeIn} className="flex justify-center mt-8">
                <Button
                  onClick={() => setDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
                  variant="outline"
                  className="rounded-xl px-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Charger plus
                  <span className="ml-2 text-xs text-gray-400">
                    ({displayCount}/{filteredActors.length})
                  </span>
                </Button>
              </motion.div>
            )}

            {/* Results Count */}
            {!hasMore && filteredActors.length > 0 && (
              <p className="text-center text-xs text-gray-400 mt-6">
                Affichage de {filteredActors.length} acteur(s) sur {actors.length}
              </p>
            )}
          </>
        )}
      </motion.div>

      {/* Réseaux d'Entrepreneurs Section */}
      <motion.div variants={fadeIn}>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Réseaux d&apos;Entrepreneurs
          </h2>
          <p className="text-sm text-gray-500 mt-1">Les principaux réseaux qui connectent les entrepreneurs en France.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_NETWORKS.map((network, i) => (
            <motion.div
              key={network.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${network.color} flex items-center justify-center mb-3`}>
                    <network.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">{network.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">{network.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{network.region}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
                      <Users className="w-3 h-3" />{network.memberCount.toLocaleString('fr-FR')} membres
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div variants={fadeIn}>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            Questions fréquentes
          </h2>
          <p className="text-sm text-gray-500 mt-1">Trouvez rapidement des réponses aux questions les plus courantes.</p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2 sm:p-4">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border-b border-gray-100 last:border-0 px-2">
                  <AccordionTrigger className="text-sm font-semibold text-gray-800 hover:text-indigo-600 hover:no-underline py-4 text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
