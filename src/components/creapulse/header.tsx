'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type UserRole } from '@/hooks/use-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCurrentTabLabel, roleConfig } from './sidebar'
import SessionTimerGauge from './session-timer-gauge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Bell, Menu, X, Zap, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const roleLabels: Record<UserRole, string> = {
  user: 'Porteur de projet',
  counselor: 'Conseiller',
  admin: 'Administrateur',
}

const roleColors: Record<UserRole, string> = {
  user: 'bg-emerald-100 text-emerald-700',
  counselor: 'bg-violet-100 text-violet-700',
  admin: 'bg-amber-100 text-amber-700',
}

interface Notification {
  id: string
  title: string
  timeAgo: string
}

export default function Header() {
  const isMobile = useIsMobile()
  const { currentRole, sidebarOpen, userName, userId, setUserTab, setCounselorTab, setAdminTab, logout } = useAppStore()
  const tabLabel = useCurrentTabLabel()
  const config = roleConfig[currentRole]

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsLoaded, setNotificationsLoaded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (tab: string) => {
    if (currentRole === 'user') setUserTab(tab as any)
    else if (currentRole === 'counselor') setCounselorTab(tab as any)
    else setAdminTab(tab as any)
    setMobileMenuOpen(false)
  }

  const isActive = (tab: string) => {
    if (currentRole === 'user') return useAppStore.getState().userTab === tab
    if (currentRole === 'counselor') return useAppStore.getState().counselorTab === tab
    return useAppStore.getState().adminTab === tab
  }

  useEffect(() => {
    if (!userId) {
      setNotificationsLoaded(true)
      return
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`)
        if (!res.ok) throw new Error('Failed to fetch notifications')
        const data = await res.json()

        if (Array.isArray(data) && data.length > 0) {
          setNotifications(
            data.slice(0, 5).map((n: { id?: string; title?: string; message?: string; timeAgo?: string; createdAt?: string }) => ({
              id: n.id || String(Math.random()),
              title: n.title || n.message || 'Notification',
              timeAgo: n.timeAgo || (n.createdAt ? `Il y a ${Math.max(1, Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 60000))} min` : 'Récemment'),
            }))
          )
        }
      } catch {
        // Silently fail — will show "no notifications" state
      } finally {
        setNotificationsLoaded(true)
      }
    }
    fetchNotifications()
  }, [userId])

  return (
    <header
      className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100"
      style={{
        marginLeft: isMobile ? 0 : sidebarOpen ? 260 : 72,
        transition: 'margin-left 0.2s ease',
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <img src="/logo-gidef.svg" alt="GIDEF" className="h-8 w-auto" />
                      <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Echo Entreprendre</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Role label */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className={`text-xs font-semibold ${config.color}`}>{config.label}</p>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 overflow-y-auto py-3 px-3">
                    <div className="space-y-1">
                      {config.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.tab)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive(item.tab) ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <item.icon className="w-4.5 h-4.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </nav>

                  {/* User footer */}
                  <div className="border-t border-gray-100 p-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
                          {userName.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{config.label}</p>
                      </div>
                      <button onClick={logout} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {tabLabel || 'Tableau de bord'}
            </h2>
            <Badge variant="secondary" className={`text-xs hidden sm:inline-flex shrink-0 ${roleColors[currentRole]}`}>
              {roleLabels[currentRole]}
            </Badge>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(currentRole === 'user' || currentRole === 'counselor') && <SessionTimerGauge />}
          {/* Search */}
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              className="w-64 h-9 pl-9 text-sm rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white"
            />
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="w-5 h-5 text-gray-500" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-gray-500" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
              </div>
              {!userId ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-gray-500">Connectez-vous pour voir vos notifications</p>
                </div>
              ) : !notificationsLoaded ? (
                <div className="px-3 py-4 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="w-full h-4 bg-gray-200 rounded mb-1" />
                      <div className="w-24 h-3 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-gray-500">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 py-3">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-500">{notification.timeAgo}</p>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Avatar */}
          <Avatar className="w-8 h-8 cursor-pointer">
            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">
              {userName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
