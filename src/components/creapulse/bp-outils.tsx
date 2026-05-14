'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BusinessModelCanvas from './bp-bmc'
import PitchDeckGenerator from './bp-pitch-deck'
import SmartRoadmapGenerator from './bp-smart-roadmap'
import {
  LayoutGrid,
  Presentation,
  Route,
  Sparkles,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react'

type ToolId = 'bmc' | 'pitch-deck' | 'smart-roadmap' | null

const tools = [
  {
    id: 'bmc' as const,
    title: 'Business Model Canvas',
    description:
      'Générez les 9 blocs stratégiques de votre BMC automatiquement grâce à l\'IA. Éditez, personnalisez et exportez votre modèle.',
    icon: LayoutGrid,
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    badge: '9 blocs',
    features: ['Génération IA des 9 blocs', 'Édition inline', 'Code couleur par bloc', 'Export texte'],
  },
  {
    id: 'pitch-deck' as const,
    title: 'Pitch Deck Pro',
    description:
      'Créez un pitch deck professionnel de 10 slides prêt pour vos présentations investisseurs et partenaires.',
    icon: Presentation,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badge: '10 slides',
    features: ['10 slides structurées', 'Navigation clavier', 'Notes présentateur', 'TAM/SAM/SOM'],
  },
  {
    id: 'smart-roadmap' as const,
    title: 'Feuille de Route SMART',
    description:
      'Planifiez vos objectifs sur 6 mois avec la méthode SMART. Jalons, progression et suivi intégrés.',
    icon: Route,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badge: '6 mois',
    features: ['Objectifs SMART', 'Jalons intermédiaires', 'Suivi progression', 'Export texte'],
  },
]

export default function OutilsBPTab() {
  const [activeTool, setActiveTool] = useState<ToolId>(null)

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {activeTool ? (
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTool(null)}
              className="mb-4 gap-1 text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour aux outils
            </Button>

            {activeTool === 'bmc' && <BusinessModelCanvas />}
            {activeTool === 'pitch-deck' && <PitchDeckGenerator />}
            {activeTool === 'smart-roadmap' && <SmartRoadmapGenerator />}
          </motion.div>
        ) : (
          <motion.div
            key="tools-grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-900">Outils Business Plan</h2>
              </div>
              <p className="text-gray-500">
                Générez vos livrables stratégiques grâce à l&apos;IA. Chaque outil se pré-remplit avec les
                données de votre projet pour un résultat personnalisé et professionnel.
              </p>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Card
                    className={`group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${tool.borderColor} hover:border-opacity-80`}
                    onClick={() => setActiveTool(tool.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-sm`}>
                          <tool.icon className="w-5 h-5 text-white" />
                        </div>
                        <Badge variant="secondary" className="text-xs font-medium">
                          {tool.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3 group-hover:text-emerald-600 transition-colors">
                        {tool.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">
                        {tool.description}
                      </p>
                      <div className="space-y-1.5 mb-4">
                        {tool.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 group-hover:bg-emerald-50 transition-colors"
                      >
                        Ouvrir l&apos;outil
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tip */}
            <Card className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 mb-1">Conseil</p>
                    <p className="text-sm text-emerald-700">
                      Remplissez d&apos;abord les onglets <strong>Profil</strong>, <strong>Marché</strong>,{' '}
                      <strong>Financier</strong> et <strong>Stratégie</strong> pour que l&apos;IA dispose du
                      maximum de données et génère des livrables plus pertinents et personnalisés.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
