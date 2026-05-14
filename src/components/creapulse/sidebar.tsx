'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type UserRole, type EtapeNumber } from '@/hooks/use-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import {
  Zap, User, Fingerprint, FileSearch, Compass, Heart, Scale, Briefcase, ShoppingCart, Landmark,
  LayoutDashboard, Target, TrendingUp, Bot, MessageSquareText, FileOutput,
  BarChart3, Settings, MapPin, Accessibility, LogOut, Menu, ChevronLeft, ChevronRight,
  ClipboardList, FileText, Handshake, FileBarChart,
  Building2, PenLine, MessageCircle, GraduationCap, Newspaper, Route,
  ChevronDown, Users, Trophy, Bell, Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavItem = { id: string; label: string; icon: LucideIcon; tab: string }

// ====================== ÉTAPE NAVIGATION GROUPS ======================
export type EtapeGroup = {
  id: EtapeNumber
  label: string
  shortLabel: string
  icon: LucideIcon
  color: string
  items: NavItem[]
}

const etapeNavItems: EtapeGroup[] = [
  {
    id: 1,
    label: 'Mon Profil Créateur',
    shortLabel: 'Diagnostic',
    icon: Fingerprint,
    color: 'from-emerald-500 to-emerald-600',
    items: [
      { id: 'profil', label: 'Profil', icon: User, tab: 'profil' },
      { id: 'parcours-creteur', label: 'Mon Profil Créateur', icon: Fingerprint, tab: 'parcours-creteur' },
      { id: 'bilan', label: 'Bilan Découverte', icon: FileSearch, tab: 'bilan' },
      { id: 'riasec', label: 'Orientation RIASEC', icon: Compass, tab: 'riasec' },
      { id: 'motivations', label: 'Motivations', icon: Heart, tab: 'motivations' },
      { id: 'competences', label: 'Compétences', icon: Briefcase, tab: 'competences' },
    ],
  },
  {
    id: 2,
    label: 'Ma Modélisation',
    shortLabel: 'Modélisation',
    icon: FileText,
    color: 'from-blue-500 to-blue-600',
    items: [
      { id: 'inscription', label: 'Inscription Projet', icon: PenLine, tab: 'inscription' },
      { id: 'juridique', label: 'Juridique', icon: Scale, tab: 'juridique' },
      { id: 'outils', label: 'Outils BP', icon: FileBarChart, tab: 'outils' },
    ],
  },
  {
    id: 3,
    label: 'Ma Stratégie de Viabilité',
    shortLabel: 'Stratégie',
    icon: Target,
    color: 'from-violet-500 to-violet-600',
    items: [
      { id: 'marche', label: 'Marché', icon: ShoppingCart, tab: 'marche' },
      { id: 'financier', label: 'Financier', icon: Landmark, tab: 'financier' },
      { id: 'strategie', label: 'Stratégie', icon: Target, tab: 'strategie' },
      { id: 'financement', label: 'Financement', icon: TrendingUp, tab: 'financement' },
      { id: 'changement-echelle', label: "Changement d'Échelle", icon: TrendingUp, tab: 'changement-echelle' },
    ],
  },
  {
    id: 4,
    label: 'Mon Écosystème',
    shortLabel: 'Écosystème',
    icon: Users,
    color: 'from-amber-500 to-amber-600',
    items: [
      { id: 'annuaire', label: 'Annuaire Acteurs', icon: Building2, tab: 'annuaire' },
      { id: 'forum', label: 'Forum', icon: MessageCircle, tab: 'forum' },
      { id: 'mentorat', label: 'Mentorat', icon: GraduationCap, tab: 'mentorat' },
      { id: 'actualites', label: 'Actualités', icon: Newspaper, tab: 'actualites' },
    ],
  },
  {
    id: 5,
    label: 'Mon Pilotage',
    shortLabel: 'Pilotage',
    icon: LayoutDashboard,
    color: 'from-teal-500 to-teal-600',
    items: [
      { id: 'parcours', label: 'Mon Parcours', icon: Route, tab: 'parcours' },
      { id: 'tableau-de-bord', label: 'Tableau de Bord', icon: LayoutDashboard, tab: 'tableau-de-bord' },
    ],
  },
]

// Flat list of all user nav items (for notifications, backwards compat, etc.)
const allUserNavItems: NavItem[] = etapeNavItems.flatMap(g => g.items)

const notificationNavItem: NavItem = { id: 'notifications', label: 'Notifications', icon: Bell, tab: 'notifications' }

const counselorNavItems: NavItem[] = [
  { id: 'entretien', label: 'Entretien', icon: ClipboardList, tab: 'entretien' },
  { id: 'ai-copilote', label: 'IA Co-Pilote', icon: Bot, tab: 'ai-copilote' },
  { id: 'notes', label: 'Notes', icon: FileText, tab: 'notes' },
  { id: 'chat-marche', label: 'Chat Marché', icon: MessageSquareText, tab: 'chat-marche' },
  { id: 'go-nogo', label: 'Go/No-Go', icon: Scale, tab: 'go-nogo' },
  { id: 'livrables', label: 'Livrables', icon: FileOutput, tab: 'livrables' },
  { id: 'collaboration', label: 'Collaboration', icon: MessageSquareText, tab: 'collaboration' },
  { id: 'synthese', label: 'Synthèse', icon: FileBarChart, tab: 'synthese' },
]

const adminNavItems: NavItem[] = [
  { id: 'vue-ensemble', label: "Vue d'ensemble", icon: BarChart3, tab: 'vue-ensemble' },
  { id: 'gestion-modulaire', label: 'Gestion Modulaire', icon: Settings, tab: 'gestion-modulaire' },
  { id: 'monitoring', label: 'Monitoring Territorial', icon: MapPin, tab: 'monitoring' },
  { id: 'handicap', label: 'Référent Handicap', icon: Accessibility, tab: 'handicap' },
  { id: 'partenariats', label: 'Partenariats', icon: Handshake, tab: 'partenariats' },
  { id: 'indicateurs', label: 'Indicateurs FR', icon: BarChart3, tab: 'indicateurs' },
]

const roleConfig: Record<UserRole, { label: string; items: NavItem[]; color: string }> = {
  user: { label: 'Porteur de projet', items: allUserNavItems, color: 'text-emerald-600' },
  counselor: { label: 'Conseiller', items: counselorNavItems, color: 'text-violet-600' },
  admin: { label: 'Administrateur', items: adminNavItems, color: 'text-amber-600' },
}

export { roleConfig, etapeNavItems }

// ====================== STEP PROGRESS BAR ======================
function StepProgressBar({ currentEtape, collapsed }: { currentEtape: EtapeNumber; collapsed: boolean }) {
  const steps: { num: EtapeNumber; label: string }[] = [
    { num: 1, label: 'Diagnostic' },
    { num: 2, label: 'Modélisation' },
    { num: 3, label: 'Stratégie' },
    { num: 4, label: 'Écosystème' },
    { num: 5, label: 'Pilotage' },
  ]

  const stepColors: Record<EtapeNumber, string> = {
    1: 'bg-emerald-500',
    2: 'bg-blue-500',
    3: 'bg-violet-500',
    4: 'bg-amber-500',
    5: 'bg-teal-500',
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-3">
        <div className="flex items-center gap-1">
          {steps.map((s) => (
            <Tooltip key={s.num} delayDuration={0}>
              <TooltipTrigger asChild>
                <div className={`w-2.5 h-2.5 rounded-full transition-all ${s.num === currentEtape ? stepColors[s.num] + ' scale-125 ring-2 ring-offset-1 ring-' + (s.num === 1 ? 'emerald' : s.num === 2 ? 'blue' : s.num === 3 ? 'violet' : s.num === 4 ? 'amber' : 'teal') + '-300' : s.num < currentEtape ? stepColors[s.num] : 'bg-gray-200'}`} />
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{s.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                s.num === currentEtape
                  ? stepColors[s.num] + ' text-white ring-2 ring-offset-1'
                  : s.num < currentEtape
                    ? stepColors[s.num] + ' text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {s.num < currentEtape ? '✓' : s.num}
              </div>
              <span className={`text-[9px] font-medium leading-none ${s.num === currentEtape ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-all ${s.num < currentEtape ? stepColors[s.num] : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ====================== ACCORDION NAV ITEM BUTTON ======================
function EtapeNavItemButton({ item, active, collapsed, onClick }: { item: NavItem; active: boolean; collapsed: boolean; onClick: () => void }) {
  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button onClick={onClick} className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <item.icon className={`w-4 h-4 ${active ? 'text-emerald-600' : ''}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-sm">{item.label}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
      <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-600' : ''}`} />
      <span className="truncate">{item.label}</span>
    </button>
  )
}

// ====================== MAIN SIDEBAR ======================
export default function Sidebar() {
  const isMobile = useIsMobile()
  const [openEtapes, setOpenEtapes] = useState<string[]>(['etape-1'])
  const { currentRole, sidebarOpen, toggleSidebar, setRole, setUserTab, setCounselorTab, setAdminTab, setEtape, logout, userName, currentEtape } = useAppStore()
  const config = roleConfig[currentRole]
  const isUser = currentRole === 'user'

  const handleNavClick = (tab: string) => {
    if (currentRole === 'user') setUserTab(tab as any)
    else if (currentRole === 'counselor') setCounselorTab(tab as any)
    else setAdminTab(tab as any)
    if (isMobile) useAppStore.getState().setMobileNavOpen(false)
  }

  const handleEtapeNavClick = (tab: string, etapeId: EtapeNumber) => {
    handleNavClick(tab)
    // Auto-switch étape tracking when clicking an item
    setEtape(etapeId)
  }

  const handleRoleChange = (role: UserRole) => setRole(role)

  const isActive = (tab: string) => {
    if (currentRole === 'user') return useAppStore.getState().userTab === tab
    if (currentRole === 'counselor') return useAppStore.getState().counselorTab === tab
    return useAppStore.getState().adminTab === tab
  }

  // Build the user accordion nav section
  const userAccordionNav = (
    <AccordionPrimitive.Root
      type="multiple"
      value={openEtapes}
      onValueChange={setOpenEtapes}
      className="space-y-1"
    >
      {etapeNavItems.map((group) => {
        const hasActiveItem = group.items.some(i => isActive(i.tab))
        return (
          <AccordionPrimitive.Item key={`etape-${group.id}`} value={`etape-${group.id}`}>
            <AccordionPrimitive.Trigger asChild>
              <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm font-medium transition-all hover:bg-gray-50 group data-[state=open]:bg-gray-50">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${group.color} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                  {group.id}
                </div>
                {sidebarOpen && (
                  <>
                    <span className={`flex-1 text-left truncate ${hasActiveItem ? 'text-gray-900' : 'text-gray-600'}`}>{group.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </>
                )}
              </button>
            </AccordionPrimitive.Trigger>
            <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <div className="pb-1 pl-1 pt-0.5 space-y-0.5">
                {group.items.map((item) => (
                  <EtapeNavItemButton
                    key={item.id}
                    item={item}
                    active={isActive(item.tab)}
                    collapsed={!sidebarOpen}
                    onClick={() => handleEtapeNavClick(item.tab, group.id)}
                  />
                ))}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        )
      })}
    </AccordionPrimitive.Root>
  )

  // Non-user nav (counselor / admin)
  const standardNav = (
    <div className="space-y-1">
      {config.items.map((item) => {
        const active = isActive(item.tab)
        if (sidebarOpen || isMobile) {
          return (
            <button key={item.id} onClick={() => handleNavClick(item.tab)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <item.icon className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-emerald-600' : ''}`} /><span className="truncate">{item.label}</span>
            </button>
          )
        }
        return (
          <Tooltip key={item.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button onClick={() => handleNavClick(item.tab)} className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <item.icon className={`w-4.5 h-4.5 ${active ? 'text-emerald-600' : ''}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-sm">{item.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-100 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
        <AnimatePresence>{sidebarOpen && (
          <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent whitespace-nowrap overflow-hidden">Echo Entreprendre</motion.span>
        )}</AnimatePresence>
        {!isMobile && <button onClick={toggleSidebar} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">{sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>}
      </div>

      <div className="px-3 py-3 border-b border-gray-100 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`w-full justify-start gap-2 h-9 ${sidebarOpen ? '' : 'px-0 justify-center'}`}>
              <Scale className={`w-4 h-4 shrink-0 ${config.color}`} />
              {sidebarOpen && <span className="text-sm font-medium truncate">{config.label}</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {Object.entries(roleConfig).map(([role, cfg]) => (
              <DropdownMenuItem key={role} onClick={() => handleRoleChange(role as UserRole)} className={currentRole === role ? 'bg-gray-50' : ''}>
                <Scale className={`w-4 h-4 mr-2 ${cfg.color}`} />{cfg.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Step progress bar (user only) */}
      {isUser && <StepProgressBar currentEtape={currentEtape} collapsed={!sidebarOpen} />}

      <nav className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
        {isUser ? userAccordionNav : standardNav}
      </nav>

      {/* Notifications button for user */}
      {isUser && sidebarOpen && (
        <div className="px-3 pb-1">
          <button
            onClick={() => handleNavClick('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${isActive('notifications') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Bell className={`w-4 h-4 shrink-0 ${isActive('notifications') ? 'text-emerald-600' : ''}`} />
            <span className="truncate">Notifications</span>
          </button>
        </div>
      )}
      {isUser && !sidebarOpen && (
        <div className="px-2 pb-1">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button onClick={() => handleNavClick('notifications')} className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${isActive('notifications') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Bell className={`w-4 h-4 ${isActive('notifications') ? 'text-emerald-600' : ''}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-sm">Notifications</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="border-t border-gray-100 p-3 shrink-0">
        <div className={`flex items-center gap-3 ${sidebarOpen || isMobile ? '' : 'justify-center'}`}>
          <Avatar className="w-9 h-9"><AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">{userName.split(' ').map((n) => n[0]).join('')}</AvatarFallback></Avatar>
          {sidebarOpen && <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{userName}</p><p className="text-xs text-gray-500 truncate">{config.label}</p></div>}
          <Tooltip delayDuration={0}><TooltipTrigger asChild><button onClick={logout} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button></TooltipTrigger><TooltipContent side="right">Déconnexion</TooltipContent></Tooltip>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    // Mobile: show first 5 items from étape 1 + Plus sheet
    const mobileQuickItems = etapeNavItems[0].items.slice(0, 5)

    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {mobileQuickItems.map((item) => (
            <button key={item.id} onClick={() => handleNavClick(item.tab)} className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${isActive(item.tab) ? 'text-emerald-600' : 'text-gray-400'}`}>
              <item.icon className="w-5 h-5" /><span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <Sheet>
            <SheetTrigger asChild><button className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-gray-400"><Menu className="w-5 h-5" /><span className="text-[10px] font-medium">Plus</span></button></SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
              <div className="py-4">
                <h3 className="text-lg font-semibold mb-2 px-3">Mon Parcours</h3>
                <p className="text-sm text-gray-500 mb-4 px-3">5 étapes pour structurer votre projet entrepreneurial.</p>
                <div className="space-y-1">
                  {/* Notifications */}
                  <button onClick={() => handleNavClick('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive('notifications') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Bell className="w-5 h-5" />Notifications
                  </button>
                  {/* Accordion groups */}
                  <AccordionPrimitive.Root type="multiple" defaultValue={['etape-1']} className="space-y-1 mt-2">
                    {etapeNavItems.map((group) => (
                      <AccordionPrimitive.Item key={`m-etape-${group.id}`} value={`m-etape-${group.id}`}>
                        <AccordionPrimitive.Trigger asChild>
                          <button className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-all group">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${group.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                              {group.id}
                            </div>
                            <span className="flex-1 text-left">{group.label}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </button>
                        </AccordionPrimitive.Trigger>
                        <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                          <div className="pb-1 pl-4 space-y-0.5">
                            {group.items.map((item) => (
                              <button key={item.id} onClick={() => handleEtapeNavClick(item.tab, group.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.tab) ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <item.icon className="w-5 h-5" />{item.label}
                              </button>
                            ))}
                          </div>
                        </AccordionPrimitive.Content>
                      </AccordionPrimitive.Item>
                    ))}
                  </AccordionPrimitive.Root>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    )
  }

  return (
    <motion.aside animate={{ width: sidebarOpen ? 272 : 72 }} transition={{ duration: 0.2, ease: "easeInOut" as const }} className="fixed left-0 top-0 bottom-0 z-30 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      {sidebarContent}
    </motion.aside>
  )
}

export function useCurrentTab() {
  const currentRole = useAppStore((s) => s.currentRole)
  const userTab = useAppStore((s) => s.userTab)
  const counselorTab = useAppStore((s) => s.counselorTab)
  const adminTab = useAppStore((s) => s.adminTab)
  if (currentRole === 'user') return userTab
  if (currentRole === 'counselor') return counselorTab
  return adminTab
}

export function useCurrentTabLabel() {
  const tab = useCurrentTab()
  const allItems = [...allUserNavItems, notificationNavItem, ...counselorNavItems, ...adminNavItems]
  const found = allItems.find((i) => i.tab === tab)
  return found?.label ?? ''
}
