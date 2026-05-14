import { create } from 'zustand'

export type AppView = 'landing' | 'auth' | 'dashboard'
export type UserRole = 'user' | 'counselor' | 'admin'
export type EtapeNumber = 1 | 2 | 3 | 4 | 5
export type UserTab =
  | 'profil'
  | 'parcours-creteur'
  | 'bilan'
  | 'riasec'
  | 'motivations'
  | 'juridique'
  | 'competences'
  | 'marche'
  | 'financier'
  | 'strategie'
  | 'financement'
  | 'changement-echelle'
  | 'tableau-de-bord'
  | 'outils'
  | 'annuaire'
  | 'inscription'
  | 'forum'
  | 'mentorat'
  | 'actualites'
  | 'parcours'
  | 'notifications'
  | 'bilan-coherence'
  | 'export-bp'
  | 'rapport-echo-entreprendre'
export type CounselorTab =
  | 'entretien'
  | 'ai-copilote'
  | 'notes'
  | 'chat-marche'
  | 'go-nogo'
  | 'livrables'
  | 'collaboration'
  | 'synthese'
export type AdminTab =
  | 'vue-ensemble'
  | 'gestion-modulaire'
  | 'monitoring'
  | 'handicap'
  | 'partenariats'
  | 'indicateurs'

interface AccessibilitySettings {
  textSize: number
  highContrast: boolean
  readingLine: boolean
  readingMask: boolean
  dyslexicFont: boolean
  pauseAnimations: boolean
}

interface AppState {
  // Navigation
  currentView: AppView
  currentRole: UserRole
  sidebarOpen: boolean
  mobileNavOpen: boolean

  // Tab states
  userTab: UserTab
  counselorTab: CounselorTab
  adminTab: AdminTab

  // Étape (step) tracking for user journey
  currentEtape: EtapeNumber

  // Auth
  isLoggedIn: boolean
  userName: string
  userEmail: string
  userId: string | null

  // Accessibility
  accessibility: AccessibilitySettings
  completedModules: {
    profil: boolean
  }
  lockedTabs: UserTab[]

  // Actions
  setView: (view: AppView) => void
  setRole: (role: UserRole) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setMobileNavOpen: (open: boolean) => void

  setUserTab: (tab: UserTab) => void
  setCounselorTab: (tab: CounselorTab) => void
  setAdminTab: (tab: AdminTab) => void

  setEtape: (etape: EtapeNumber) => void

  login: (name: string, email: string, id?: string) => void
  logout: () => void

  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void
  setProfileCompleted: (completed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'landing',
  currentRole: 'user',
  sidebarOpen: true,
  mobileNavOpen: false,

  // Tab states
  userTab: 'profil',
  counselorTab: 'entretien',
  adminTab: 'vue-ensemble',

  // Étape tracking
  currentEtape: 1,

  // Auth
  isLoggedIn: false,
  userName: '',
  userEmail: '',
  userId: null,

  // Accessibility
  accessibility: {
    textSize: 100,
    highContrast: false,
    readingLine: false,
    readingMask: false,
    dyslexicFont: false,
    pauseAnimations: false,
  },
  completedModules: {
    profil: false,
  },
  lockedTabs: ['bilan', 'riasec', 'motivations', 'competences'],

  // Actions
  setView: (view) => set({ currentView: view }),
  setRole: (role) => set({ currentRole: role }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  setUserTab: (tab) => set((s) => {
    if (s.currentRole === 'user' && s.lockedTabs.includes(tab)) return s
    return { userTab: tab }
  }),
  setCounselorTab: (tab) => set({ counselorTab: tab }),
  setAdminTab: (tab) => set({ adminTab: tab }),

  setEtape: (etape) => set({ currentEtape: etape }),

  login: (name, email, id) => set({
    isLoggedIn: true,
    userName: name,
    userEmail: email,
    userId: id || null,
    currentView: 'dashboard',
  }),
  logout: () => set({
    isLoggedIn: false,
    currentView: 'landing',
    currentRole: 'user',
    userTab: 'profil',
    userId: null,
    currentEtape: 1,
  }),

  updateAccessibility: (settings) =>
    set((s) => ({ accessibility: { ...s.accessibility, ...settings } })),
  setProfileCompleted: (completed) =>
    set((s) => ({
      completedModules: { ...s.completedModules, profil: completed },
      lockedTabs: completed ? [] : ['bilan', 'riasec', 'motivations', 'competences'],
    })),
}))
