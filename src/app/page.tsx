'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/hooks/use-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from '@/components/creapulse/landing'
import AuthPage from '@/components/creapulse/auth'
import Sidebar from '@/components/creapulse/sidebar'
import Header from '@/components/creapulse/header'
import UserDashboard from '@/components/creapulse/user-dashboard'
import CounselorDashboard from '@/components/creapulse/counselor-dashboard'
import AdminDashboard from '@/components/creapulse/admin-dashboard'
import AccessibilityPanel from '@/components/creapulse/accessibility-panel'

function DashboardView() {
  const currentRole = useAppStore((s) => s.currentRole)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const isMobile = useIsMobile()

  const marginLeft = useMemo(() => {
    if (isMobile) return 0
    return sidebarOpen ? 260 : 72
  }, [sidebarOpen, isMobile])

  return (
    <div
      className="min-h-screen bg-[#f8fafc] transition-[margin-left] duration-200"
      style={{ marginLeft }}
    >
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRole}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {currentRole === 'user' && <UserDashboard />}
            {currentRole === 'counselor' && <CounselorDashboard />}
            {currentRole === 'admin' && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>
      <AccessibilityPanel />
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur px-4 sm:px-6 lg:px-8 py-3 text-xs text-gray-600">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="font-medium">BGE Bretagne · France Travail · Echo Entreprendre</p>
          <p>Accessibilité : accessibilite@bge-bretagne.com · Mentions légales</p>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  const currentView = useAppStore((s) => s.currentView)
  const accessibility = useAppStore((s) => s.accessibility)
  const isMobile = useIsMobile()

  return (
    <div
      className={`a11y-resize ${accessibility.highContrast ? 'a11y-high-contrast' : ''} ${accessibility.dyslexicFont ? 'a11y-dyslexic-font' : ''} ${accessibility.pauseAnimations ? 'a11y-pause-animations' : ''}`}
      style={{ fontSize: `${accessibility.textSize}%` }}
    >
      {/* Reading line overlay */}
      <div className="reading-line-overlay" />
      {/* Reading mask overlay */}
      <div className="reading-mask-overlay" />

      <AnimatePresence mode="wait">
        {currentView === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage />
            <AccessibilityPanel />
          </motion.div>
        )}

        {currentView === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AuthPage />
          </motion.div>
        )}

        {currentView === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!isMobile && <Sidebar />}
            <DashboardView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
