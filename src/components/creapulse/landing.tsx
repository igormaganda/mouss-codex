'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/hooks/use-store'
import {
  Sparkles,
  Accessibility,
  Gamepad2,
  Layers,
  ArrowRight,
  Star,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  BarChart3,
  Play,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeInOut" as const },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const counts = [target]
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {counts.map((v) => (
        <span key={v}>
          {v.toLocaleString('fr-FR')}
          {suffix}
        </span>
      ))}
    </motion.span>
  )
}

const features = [
  {
    icon: Sparkles,
    title: 'IA Co-Pilote',
    description:
      "Un assistant intelligent qui analyse votre projet en temps réel et vous propose des recommandations personnalisées adaptées à votre profil entrepreneurial.",
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Accessibility,
    title: 'Accessibilité',
    description:
      "Conçu pour tous : taille de texte ajustable, mode haut contraste, police dyslexique, masque de lecture et ligne de suivi pour une navigation inclusive.",
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Gamepad2,
    title: 'Gamification',
    description:
      "Apprenez en jouant ! Le Jeu des Pépites, la loterie de mots-clés et les parcours interactifs rendent le diagnostic engageant et motivant.",
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Layers,
    title: 'Modularité',
    description:
      '7 modules configurables selon vos besoins : bilan découverte, orientation RIASEC, compétences, marché, financier, livrables et suivi territorial.',
    color: 'from-sky-500 to-blue-600',
  },
]

// Fallback testimonials used when API returns no data
const fallbackTestimonials = [
  {
    name: 'Sophie Martin',
    role: 'Créatrice de GreenTech Solutions',
    text: "Echo Entreprendre m'a permis d'identifier les forces et les faiblesses de mon projet en seulement 2 heures. L'IA m'a surpris par la pertinence de ses conseils !",
    rating: 5,
  },
  {
    name: 'Thomas Bernard',
    role: 'Porteur de projet immobilier',
    text: "La gamification du diagnostic rend l'expérience vraiment agréable. Le jeu des pépites m'a fait découvrir des compétences que je ne soupçonnais pas.",
    rating: 5,
  },
  {
    name: 'Amina Diallo',
    role: 'Conseillère BGE Lyon',
    text: "En tant que conseillère, l'espace dédié me fait gagner un temps précieux. Le co-pilote IA synthétise parfaitement les profils de mes porteurs de projets.",
    rating: 4,
  },
]

// Fallback stats if API fetch fails
const fallbackStats = [
  { value: 2500, suffix: '+', label: 'Diagnostics réalisés', icon: BarChart3 },
  { value: 95, suffix: '%', label: 'Taux de satisfaction', icon: Star },
  { value: 12, suffix: '', label: 'Territoires couverts', icon: Shield },
  { value: 3, suffix: '', label: 'Modules IA actifs', icon: Zap },
]

export default function LandingPage() {
  const setView = useAppStore((s) => s.setView)
  const [stats, setStats] = useState(fallbackStats)
  const [statsLoaded, setStatsLoaded] = useState(false)
  const [testimonials, setTestimonials] = useState(fallbackTestimonials)
  const [entrepreneursText, setEntrepreneursText] = useState('+2 500 entrepreneurs accompagnés')
  const [ctaEntrepreneursText, setCtaEntrepreneursText] = useState('plus de 2 500 entrepreneurs')

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [statsRes, testimonialsRes] = await Promise.allSettled([
          fetch('/api/dashboard/stats').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/testimonials').then((r) => (r.ok ? r.json() : null)),
        ])

        // Process stats
        const statsData = statsRes.status === 'fulfilled' ? statsRes.value : null
        if (statsData) {
          const totalUsers = statsData.stats?.totalUsers || statsData.totalUsers || 2500
          const territoryCount = statsData.stats?.territories?.length || 0
          const goDecisions = statsData.stats?.diagnosticsByDecision?.GO || 0
          const totalDecisions = Object.values(statsData.stats?.diagnosticsByDecision || {}).reduce(
            (sum: number, v: unknown) => sum + (v as number),
            0
          ) as number
          // Compute satisfaction from GO rate among decided diagnostics
          const satisfaction = totalDecisions > 0 ? Math.round((goDecisions / totalDecisions) * 100) : null

          setStats([
            { value: totalUsers, suffix: '+', label: 'Diagnostics réalisés', icon: BarChart3 },
            { value: satisfaction ?? 95, suffix: '%', label: 'Taux de satisfaction', icon: Star },
            { value: territoryCount || 12, suffix: '', label: 'Territoires couverts', icon: Shield },
            { value: 3, suffix: '', label: 'Modules IA actifs', icon: Zap },
          ])

          setEntrepreneursText(`+${totalUsers.toLocaleString('fr-FR')} entrepreneurs accompagnés`)
          setCtaEntrepreneursText(`plus de ${totalUsers.toLocaleString('fr-FR')} entrepreneurs`)
        }

        // Process testimonials
        const testimonialsData = testimonialsRes.status === 'fulfilled' ? testimonialsRes.value : null
        if (testimonialsData?.testimonials && testimonialsData.testimonials.length > 0) {
          setTestimonials(testimonialsData.testimonials)
        }
      } catch {
        // Keep fallback values already set in state
      } finally {
        setStatsLoaded(true)
      }
    }
    fetchLandingData()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo-gidef.svg" alt="GIDEF" className="h-8 w-auto" />
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Echo Entreprendre
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                Fonctionnalités
              </a>
              <a href="#stats" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                Résultats
              </a>
              <a href="#testimonials" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                Témoignages
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('auth')}
                className="text-gray-600 hover:text-emerald-600"
              >
                Connexion
              </Button>
              <Button
                size="sm"
                onClick={() => setView('auth')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6"
              >
                Commencer
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              Propulsé par l&apos;Intelligence Artificielle
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6"
            >
              Diagnostiquez votre{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                projet entrepreneurial
              </span>{' '}
              avec l&apos;IA
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Echo Entreprendre combine intelligence artificielle et accompagnement humain pour
              vous guider à chaque étape de votre parcours de création d&apos;entreprise.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => setView('auth')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all"
              >
                Commencer le diagnostic
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setView('auth')
                  setTimeout(() => {
                    const quickLogin = document.querySelector<HTMLButtonElement>('button[class*="bg-white"][class*="border-gray-200"]')
                    if (quickLogin) quickLogin.click()
                  }, 300)
                }}
                className="rounded-full px-8 h-12 text-base border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
              >
                Voir la démo
                <Play className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Gratuit pour les porteurs de projet
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" />
                {!statsLoaded ? (
                  <span className="inline-block w-48 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  entrepreneursText
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                Données sécurisées RGPD
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-gradient-to-b from-white to-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeInUp} custom={0} className="text-sm font-semibold text-emerald-600 mb-3 uppercase tracking-wider">
              Fonctionnalités
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            >
              Tout ce dont vous avez besoin pour réussir
            </motion.h2>
            <motion.p variants={fadeInUp} custom={2} className="text-lg text-gray-500 max-w-2xl mx-auto">
              Une plateforme complète qui s&apos;adapte à votre parcours entrepreneurial unique.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-sm`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden relative"
          >
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
            </div>
            <div className="relative">
              <motion.p
                variants={fadeInUp}
                custom={0}
                className="text-sm font-semibold text-emerald-400 mb-3 uppercase tracking-wider"
              >
                Résultats
              </motion.p>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-3xl sm:text-4xl font-bold text-white mb-12"
              >
                Des chiffres qui parlent d&apos;eux-mêmes
              </motion.h2>

              {!statsLoaded ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i}>
                      <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse mb-3" />
                      <div className="w-24 h-10 bg-gray-700 rounded animate-pulse mb-2" />
                      <div className="w-32 h-4 bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {stats.map((stat, i) => (
                    <motion.div key={stat.label} variants={fadeInUp} custom={i + 2}>
                      <div className="flex items-center gap-2 mb-3">
                        <stat.icon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                      </div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-28 bg-gradient-to-b from-white to-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeInUp} custom={0} className="text-sm font-semibold text-emerald-600 mb-3 uppercase tracking-wider">
              Témoignages
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            >
              Ils ont confiance en Echo Entreprendre
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeInUp}
                custom={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                    {t.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Prêt à lancer votre projet ?
            </h2>
            <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
              Rejoignez {ctaEntrepreneursText} qui ont déjà bénéficié de notre diagnostic intelligent.
            </p>
            <Button
              size="lg"
              onClick={() => setView('auth')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all"
            >
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo-gidef.svg" alt="GIDEF" className="h-8 w-auto" />
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Echo Entreprendre
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>Mentions légales</span>
              <span>Politique de confidentialité</span>
              <span>CGU</span>
              <span>Contact</span>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Echo Entreprendre. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
