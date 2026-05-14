'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  UserCheck,
  GraduationCap,
  Lightbulb,
  Heart,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  Pencil,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Target,
  BookOpen,
  Building2,
  Rocket,
  Star,
  Award,
} from 'lucide-react'

// ======================== TYPES ========================

type StepId = 'mode' | 'personal' | 'parcours' | 'projet' | 'besoins' | 'recap'

interface FormData {
  // Step 1: Mode
  mode: 'autonome' | 'assiste' | ''
  // Step 2: Personal
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  situation: string
  // Step 3: Parcours
  educationLevel: string
  educationField: string
  experienceYears: string
  skills: string
  previousBusiness: string
  // Step 4: Projet
  projectName: string
  projectSector: string
  projectType: string
  projectDescription: string
  projectStage: string
  // Step 5: Besoins
  needsFinancement: boolean[]
  needsFormation: boolean[]
  needsMentorat: boolean[]
  needsReseautage: boolean[]
  needsLocaux: boolean[]
  needsJuridique: boolean[]
  supportType: string
  actionsTaken: string
  resources: string
  comments: string
}

// ======================== CONSTANTS ========================

const STEPS: { id: StepId; label: string; icon: React.ElementType }[] = [
  { id: 'mode', label: 'Mode', icon: User },
  { id: 'personal', label: 'Personnel', icon: UserCheck },
  { id: 'parcours', label: 'Parcours', icon: GraduationCap },
  { id: 'projet', label: 'Projet', icon: Lightbulb },
  { id: 'besoins', label: 'Besoins', icon: Heart },
  { id: 'recap', label: 'Récapitulatif', icon: ClipboardCheck },
]

const SITUATIONS = ['Salarié(e)', 'Indépendant(e)', 'Étudiant(e)', 'Demandeur(se) d\'emploi', 'En reconversion', 'Autre']

const EDUCATION_LEVELS = ['Sans diplôme', 'CAP/BEP', 'Bac', 'Bac+2 (BTS/DUT)', 'Licence/Bac+3', 'Master/Bac+5', 'Doctorat', 'Autre formation']

const EDUCATION_FIELDS = ['Commerce', 'Informatique', 'Gestion', 'Marketing', 'Ingénierie', 'Sciences', 'Droit', 'Médecine/Santé', 'Arts/Design', 'Enseignement', 'Autre']

const EXPERIENCE_YEARS = ['Aucune', '1 à 3 ans', '3 à 5 ans', '5 à 10 ans', '10 à 15 ans', 'Plus de 15 ans']

const PREVIOUS_BUSINESS = ['Jamais créé', 'Une entreprise (active)', 'Une entreprise (cédée)', 'Plusieurs entreprises', 'Projet avorté', 'Autre']

const SECTORS = [
  'Numérique / Tech', 'Commerce / Distribution', 'Services aux entreprises', 'Bâtiment / Construction',
  'Santé / Médical', 'Éducation / Formation', 'Agroalimentaire', 'Tourisme / Hôtellerie',
  'Énergie / Environnement', 'Industrie / Fabrication', 'Culture / Loisirs', 'Autre',
]

const PROJECT_TYPES = [
  { id: 'creation', label: 'Création', description: 'Démarrer une activité nouvelle', icon: Rocket },
  { id: 'reprise', label: 'Reprise', description: 'Reprendre une entreprise existante', icon: Building2 },
  { id: 'franchise', label: 'Franchise', description: 'S\'associer à un réseau de franchise', icon: Star },
  { id: 'croissance', label: 'Développement', description: 'Accélérer la croissance d\'une activité existante', icon: TrendingUpIcon },
]

const PROJECT_STAGES = [
  { id: 'idee', label: 'Idée', description: 'J\'ai une idée, je n\'ai pas encore commencé à la formaliser.' },
  { id: 'etude', label: 'Étude de marché', description: 'J\'analyse le marché et je valide la pertinence de mon idée.' },
  { id: 'business-plan', label: 'Business plan', description: 'Je rédige mon business plan et je prépare mes prévisions financières.' },
  { id: 'lancement', label: 'Pré-lancement', description: 'Je finalise les démarches administratives et je prépare le lancement.' },
  { id: 'actif', label: 'Activité en cours', description: 'Mon entreprise est créée et l\'activité a commencé.' },
]

const NEEDS_CONFIG = {
  needsFinancement: { category: 'Financement', items: ['Prêt d\'honneur', 'Subventions', 'Investisseurs', 'Microcrédit', 'Crowdfunding'] },
  needsFormation: { category: 'Formation', items: ['Gestion', 'Marketing', 'Comptabilité', 'Réglementation', 'Leadership'] },
  needsMentorat: { category: 'Mentorat', items: ['Parrainage', 'Coaching individuel', 'Groupes de pairs', 'Expertise métier'] },
  needsReseautage: { category: 'Réseautage', items: ['Événements', 'Salons professionnels', 'Communautés en ligne', 'Réseaux territoriaux'] },
  needsLocaux: { category: 'Locaux', items: ['Bureau partagé', 'Pépinière', 'Local commercial', 'Télétravail'] },
  needsJuridique: { category: 'Juridique', items: ['Choix du statut', 'Rédaction statuts', 'Propriété intellectuelle', 'Contrats'] },
}

const INITIAL_FORM: FormData = {
  mode: '',
  firstName: '', lastName: '', email: '', phone: '', city: '', situation: '',
  educationLevel: '', educationField: '', experienceYears: '', skills: '', previousBusiness: '',
  projectName: '', projectSector: '', projectType: '', projectDescription: '', projectStage: '',
  needsFinancement: [], needsFormation: [], needsMentorat: [], needsReseautage: [], needsLocaux: [], needsJuridique: [],
  supportType: '', actionsTaken: '', resources: '', comments: '',
}

// ======================== ANIMATIONS ========================

const fadeIn = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeInOut" as const } },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" as const } },
}

const successPop = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeInOut" as const } },
}

// ======================== HELPERS ========================

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

async function saveRegistration(data: FormData, step: StepId): Promise<boolean> {
  try {
    const token = localStorage.getItem('cp_token')
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers,
      body: JSON.stringify({ data, step }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ======================== MAIN COMPONENT ========================

export default function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [savedSteps, setSavedSteps] = useState<Set<StepId>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stepId = STEPS[currentStep].id
  const isLastStep = currentStep === STEPS.length - 1
  const isFirstStep = currentStep === 0

  // Auto-save on form changes
  useEffect(() => {
    if (stepId === 'recap') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      const ok = await saveRegistration(form, stepId)
      if (ok) {
        setSavedSteps((prev) => new Set([...prev, stepId]))
      }
      setSaving(false)
    }, 1200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [form, stepId])

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }, [])

  const toggleNeedItem = useCallback((category: keyof typeof NEEDS_CONFIG, item: string) => {
    setForm((prev) => {
      const current = prev[category] as unknown as string[]
      const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item]
      return { ...prev, [category]: next }
    })
  }, [])

  // Validation per step
  const validateStep = useCallback((stepIndex: number): boolean => {
    const step = STEPS[stepIndex].id
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (step === 'mode') {
      if (!form.mode) newErrors.mode = 'Veuillez sélectionner un mode'
    }
    if (step === 'personal') {
      if (!form.firstName.trim()) newErrors.firstName = 'Le prénom est requis'
      if (!form.lastName.trim()) newErrors.lastName = 'Le nom est requis'
      if (!form.email.trim()) newErrors.email = 'L\'email est requis'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email invalide'
    }
    if (step === 'projet') {
      if (!form.projectName.trim()) newErrors.projectName = 'Le nom du projet est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    }
  }, [currentStep, validateStep])

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleGoToStep = useCallback((index: number) => {
    if (index < currentStep) {
      setCurrentStep(index)
    }
  }, [currentStep])

  const handleSubmit = useCallback(async () => {
    setSaving(true)
    const ok = await saveRegistration(form, 'recap')
    setSaving(false)
    if (ok) {
      setSubmitted(true)
    }
  }, [form])

  // ======================== RENDER STEP CONTENT ========================

  const renderStepContent = () => {
    switch (stepId) {
      case 'mode':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Comment souhaitez-vous procéder ?</h2>
              <p className="text-sm text-gray-500">Choisissez le mode d&apos;accompagnement qui vous correspond le mieux.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {[
                { id: 'autonome' as const, title: 'Candidat autonome', description: 'Je remplis le formulaire moi-même à mon rythme. Je peux revenir sur chaque section ultérieurement.', icon: User, color: 'from-indigo-500 to-blue-600' },
                { id: 'assiste' as const, title: 'Assisté par un conseiller', description: 'Un conseiller dédié m\'accompagne dans le remplissage et valide chaque étape avec moi.', icon: UserCheck, color: 'from-emerald-500 to-teal-600' },
              ].map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateField('mode', option.id)}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                    form.mode === option.id
                      ? 'border-indigo-400 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                      : 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  {form.mode === option.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                      <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                    </motion.div>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4`}>
                    <option.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{option.description}</p>
                </motion.button>
              ))}
            </div>
            {errors.mode && <p className="text-center text-sm text-red-500 mt-4">{errors.mode}</p>}
          </div>
        )

      case 'personal':
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Informations personnelles</h2>
              <p className="text-sm text-gray-500">Renseignez vos coordonnées pour personnaliser votre accompagnement.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Jean"
                    className={`pl-10 rounded-xl ${errors.firstName ? 'border-red-300 focus:border-red-400' : ''}`}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Dupont"
                    className={`pl-10 rounded-xl ${errors.lastName ? 'border-red-300 focus:border-red-400' : ''}`}
                  />
                </div>
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="jean.dupont@email.com"
                  className={`pl-10 rounded-xl ${errors.email ? 'border-red-300 focus:border-red-400' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">Ville</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Lyon"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Situation actuelle</Label>
              <Select value={form.situation} onValueChange={(v) => updateField('situation', v)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Sélectionnez votre situation" />
                </SelectTrigger>
                <SelectContent>
                  {SITUATIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'parcours':
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Votre parcours</h2>
              <p className="text-sm text-gray-500">Décrivez votre formation et votre expérience professionnelle.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Niveau d&apos;études</Label>
                <Select value={form.educationLevel} onValueChange={(v) => updateField('educationLevel', v)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Domaine d&apos;études</Label>
                <Select value={form.educationField} onValueChange={(v) => updateField('educationField', v)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_FIELDS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Expérience professionnelle</Label>
                <Select value={form.experienceYears} onValueChange={(v) => updateField('experienceYears', v)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_YEARS.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Expérience entrepreneuriale</Label>
                <Select value={form.previousBusiness} onValueChange={(v) => updateField('previousBusiness', v)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREVIOUS_BUSINESS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Compétences clés</Label>
              <Textarea
                value={form.skills}
                onChange={(e) => updateField('skills', e.target.value)}
                placeholder="Décrivez vos compétences principales (ex: gestion, développement, vente...)"
                className="rounded-xl border-gray-200 min-h-[100px]"
              />
              <p className="text-xs text-gray-400">Séparez vos compétences par des virgules ou des sauts de ligne.</p>
            </div>
          </div>
        )

      case 'projet':
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Votre projet</h2>
              <p className="text-sm text-gray-500">Décrivez le projet entrepreneurial que vous souhaitez réaliser.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-sm font-medium text-gray-700">
                Nom du projet <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="projectName"
                  value={form.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                  placeholder="Mon Projet Entreprise"
                  className={`pl-10 rounded-xl ${errors.projectName ? 'border-red-300 focus:border-red-400' : ''}`}
                />
              </div>
              {errors.projectName && <p className="text-xs text-red-500 mt-1">{errors.projectName}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Secteur d&apos;activité</Label>
                <Select value={form.projectSector} onValueChange={(v) => updateField('projectSector', v)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Sélectionnez un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Type de projet</Label>
                <Select value={form.projectType} onValueChange={(v) => updateField('projectType', v)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project Type Visual Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PROJECT_TYPES.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => updateField('projectType', type.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    form.projectType === type.id
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                  }`}
                >
                  <type.icon className="w-5 h-5 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold">{type.label}</p>
                </motion.button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Description du projet</Label>
              <Textarea
                value={form.projectDescription}
                onChange={(e) => updateField('projectDescription', e.target.value)}
                placeholder="Décrivez votre projet en quelques phrases : le problème que vous résolvez, votre solution, votre cible..."
                className="rounded-xl border-gray-200 min-h-[120px]"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Stade d&apos;avancement</Label>
              <RadioGroup value={form.projectStage} onValueChange={(v) => updateField('projectStage', v)} className="space-y-2">
                {PROJECT_STAGES.map((stage, i) => (
                  <label
                    key={stage.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.projectStage === stage.id
                        ? 'border-indigo-300 bg-indigo-50/50'
                        : 'border-gray-200 hover:border-indigo-200'
                    }`}
                  >
                    <RadioGroupItem value={stage.id} className="mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-500">Étape {i + 1}</span>
                        <span className="text-sm font-semibold text-gray-900">{stage.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        )

      case 'besoins':
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Vos besoins</h2>
              <p className="text-sm text-gray-500">Identifiez les domaines où vous avez besoin d&apos;accompagnement.</p>
            </div>

            {/* Needs Checkboxes Grouped by Category */}
            {Object.entries(NEEDS_CONFIG).map(([key, config]) => (
              <div key={key} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-500" />
                  {config.category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {config.items.map((item) => {
                    const checked = (form[key as keyof FormData] as unknown as string[]).includes(item)
                    return (
                      <label
                        key={item}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                          checked
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleNeedItem(key as keyof typeof NEEDS_CONFIG, item)}
                          className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                        />
                        {item}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium text-gray-700">Type de soutien souhaité</Label>
              <Select value={form.supportType} onValueChange={(v) => updateField('supportType', v)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ponctuel">Ponctuel (sur un sujet précis)</SelectItem>
                  <SelectItem value="suivi">Suivi régulier (sessions récurrentes)</SelectItem>
                  <SelectItem value="intensif">Accompagnement intensif</SelectItem>
                  <SelectItem value="autonome">Je préfère être autonome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Actions déjà réalisées</Label>
              <Textarea
                value={form.actionsTaken}
                onChange={(e) => updateField('actionsTaken', e.target.value)}
                placeholder="Ex: J'ai déjà réalisé une étude de marché, rencontré des clients potentiels..."
                className="rounded-xl border-gray-200 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Ressources disponibles</Label>
              <Textarea
                value={form.resources}
                onChange={(e) => updateField('resources', e.target.value)}
                placeholder="Ex: Apport personnel de 10 000 EUR, réseau de contacts dans le secteur..."
                className="rounded-xl border-gray-200 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Commentaires supplémentaires</Label>
              <Textarea
                value={form.comments}
                onChange={(e) => updateField('comments', e.target.value)}
                placeholder="Tout autre élément que vous souhaitez partager..."
                className="rounded-xl border-gray-200 min-h-[80px]"
              />
            </div>
          </div>
        )

      case 'recap':
        return (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Récapitulatif de votre inscription</h2>
              <p className="text-sm text-gray-500">Vérifiez vos informations avant de soumettre votre dossier.</p>
            </div>

            {/* Mode */}
            <RecapSection
              title="Mode d'accompagnement"
              icon={User}
              onEdit={() => setCurrentStep(0)}
              editLabel="Mode"
            >
              <Badge className={form.mode === 'autonome' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}>
                {form.mode === 'autonome' ? 'Candidat autonome' : form.mode === 'assiste' ? 'Assisté par un conseiller' : 'Non défini'}
              </Badge>
            </RecapSection>

            {/* Personal */}
            <RecapSection
              title="Informations personnelles"
              icon={UserCheck}
              onEdit={() => setCurrentStep(1)}
              editLabel="Personnel"
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Prénom :</span> <span className="font-medium">{form.firstName || '—'}</span></div>
                <div><span className="text-gray-500">Nom :</span> <span className="font-medium">{form.lastName || '—'}</span></div>
                <div><span className="text-gray-500">Email :</span> <span className="font-medium">{form.email || '—'}</span></div>
                <div><span className="text-gray-500">Téléphone :</span> <span className="font-medium">{form.phone || '—'}</span></div>
                <div><span className="text-gray-500">Ville :</span> <span className="font-medium">{form.city || '—'}</span></div>
                <div><span className="text-gray-500">Situation :</span> <span className="font-medium">{form.situation || '—'}</span></div>
              </div>
            </RecapSection>

            {/* Parcours */}
            <RecapSection
              title="Parcours"
              icon={GraduationCap}
              onEdit={() => setCurrentStep(2)}
              editLabel="Parcours"
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Études :</span> <span className="font-medium">{form.educationLevel || '—'}</span></div>
                <div><span className="text-gray-500">Domaine :</span> <span className="font-medium">{form.educationField || '—'}</span></div>
                <div><span className="text-gray-500">Expérience :</span> <span className="font-medium">{form.experienceYears || '—'}</span></div>
                <div><span className="text-gray-500">Antécédents :</span> <span className="font-medium">{form.previousBusiness || '—'}</span></div>
              </div>
              {form.skills && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Compétences :</span> <span className="font-medium">{form.skills}</span>
                </div>
              )}
            </RecapSection>

            {/* Projet */}
            <RecapSection
              title="Projet"
              icon={Lightbulb}
              onEdit={() => setCurrentStep(3)}
              editLabel="Projet"
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2"><span className="text-gray-500">Nom :</span> <span className="font-medium">{form.projectName || '—'}</span></div>
                <div><span className="text-gray-500">Secteur :</span> <span className="font-medium">{form.projectSector || '—'}</span></div>
                <div><span className="text-gray-500">Type :</span> <span className="font-medium">{form.projectType || '—'}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Stade :</span> <span className="font-medium">{PROJECT_STAGES.find((s) => s.id === form.projectStage)?.label || '—'}</span></div>
              </div>
              {form.projectDescription && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{form.projectDescription}</p>
              )}
            </RecapSection>

            {/* Besoins */}
            <RecapSection
              title="Besoins"
              icon={Heart}
              onEdit={() => setCurrentStep(4)}
              editLabel="Besoins"
            >
              <div className="space-y-2">
                {(Object.entries(NEEDS_CONFIG) as [keyof typeof NEEDS_CONFIG, typeof NEEDS_CONFIG[keyof typeof NEEDS_CONFIG]][]).map(([key, config]) => {
                  const selected = form[key] as unknown as string[]
                  if (selected.length === 0) return null
                  return (
                    <div key={key} className="text-sm">
                      <span className="text-gray-500">{config.category} :</span>{' '}
                      <span className="font-medium">{selected.join(', ')}</span>
                    </div>
                  )
                })}
                {form.supportType && (
                  <div className="text-sm">
                    <span className="text-gray-500">Soutien :</span>{' '}
                    <span className="font-medium">{form.supportType}</span>
                  </div>
                )}
              </div>
            </RecapSection>
          </div>
        )

      default:
        return null
    }
  }

  // ======================== SUCCESS STATE ========================

  if (submitted) {
    return (
      <motion.div initial="hidden" animate="visible" variants={successPop} className="flex flex-col items-center justify-center py-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Inscription enregistrée !
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-gray-500 text-center max-w-md mb-8"
        >
          Votre dossier a été soumis avec succès. Un conseiller vous contactera dans les 48 heures pour planifier votre premier entretien.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center gap-4"
        >
          <Button onClick={() => { setForm(INITIAL_FORM); setCurrentStep(0); setSubmitted(false) }} variant="outline" className="rounded-xl">
            Nouvelle inscription
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  // ======================== MAIN RENDER ========================

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6">
      {/* Step Indicator */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep
              const isSaved = savedSteps.has(step.id)
              const StepIcon = step.icon

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => handleGoToStep(index)}
                    className="flex flex-col items-center gap-1.5 group"
                    disabled={index > currentStep}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                        : isCurrent
                          ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200 ring-4 ring-indigo-100'
                          : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-medium hidden sm:block ${
                      isCurrent ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                    {isSaved && isCompleted && (
                      <span className="text-[9px] text-emerald-500 hidden sm:block">Sauvegardé</span>
                    )}
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                      index < currentStep ? 'bg-emerald-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Auto-save indicator */}
      {saving && stepId !== 'recap' && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Sauvegarde automatique en cours...
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepId}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={fadeIn}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              {renderStepContent()}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {!submitted && (
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrev}
            disabled={isFirstStep}
            variant="outline"
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Précédent
          </Button>

          <span className="text-xs text-gray-400">
            Étape {currentStep + 1} sur {STEPS.length}
          </span>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Soumettre mon dossier
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ======================== RECAP SECTION SUBCOMPONENT ========================

function RecapSection({
  title,
  icon: Icon,
  onEdit,
  editLabel,
  children,
}: {
  title: string
  icon: React.ElementType
  onEdit: () => void
  editLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-xs text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
        >
          <Pencil className="w-3 h-3 mr-1" />
          Modifier
        </Button>
      </div>
      {children}
    </div>
  )
}
