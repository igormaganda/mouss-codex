'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  Target,
  Clock,
  Trophy,
  Users,
  Search,
  CheckCheck,
  Trash2,
  X,
  Settings,
  Filter,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

// ==================== TYPES ====================
type NotificationType = 'opportunity' | 'reminder' | 'system' | 'achievement' | 'social'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  actions?: Array<{ label: string; value: 'accept' | 'refuse' | 'view' }>
}

interface NotificationSettings {
  types: Record<NotificationType, boolean>
  frequency: 'instant' | 'daily' | 'weekly'
}

// ==================== CONSTANTS ====================
const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bgColor: string; label: string }> = {
  opportunity: { icon: Target, color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'Opportunité' },
  reminder: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Rappel' },
  system: { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Système' },
  achievement: { icon: Trophy, color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Accomplissement' },
  social: { icon: Users, color: 'text-sky-600', bgColor: 'bg-sky-50', label: 'Social' },
}

const FILTER_TABS = [
  { value: 'all', label: 'Tous' },
  { value: 'unread', label: 'Non lues' },
  { value: 'opportunity', label: 'Opportunités' },
  { value: 'reminder', label: 'Rappels' },
  { value: 'system', label: 'Système' },
  { value: 'achievement', label: 'Accomplissements' },
  { value: 'social', label: 'Social' },
] as const

type FilterTab = (typeof FILTER_TABS)[number]['value']

// ==================== HELPERS ====================
function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  return `Il y a ${Math.floor(days / 7)} semaines`
}

function getDateGroup(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 6 * 86400000)

  if (date >= today) return "Aujourd'hui"
  if (date >= yesterday) return 'Hier'
  if (date >= weekAgo) return 'Cette semaine'
  return 'Plus ancien'
}

const GROUP_ORDER = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus ancien']

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

// ==================== ANIMATIONS ====================
const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}

// ==================== NOTIFICATION BELL ====================
export function NotificationCenterBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    const data = await fetchJson<Notification[]>('/api/notifications?unreadOnly=false', [])
    setRecentNotifications(data.slice(0, 5))
    setUnreadCount(data.filter((n) => !n.read).length)
  }, [])

  useEffect(() => {
    const load = async () => {
      await loadNotifications()
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const markAsRead = useCallback(async (id: string) => {
    await fetchJson(`/api/notifications/${id}`, null, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    })
    setRecentNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await fetchJson('/api/notifications/read-all', null, { method: 'POST' })
    setRecentNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
        {unreadCount === 0 && recentNotifications.length > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-5">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2">
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    Tout lire
                  </Button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <ScrollArea className="max-h-96">
              {recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentNotifications.map((notification) => {
                    const config = TYPE_CONFIG[notification.type]
                    const Icon = config.icon
                    return (
                      <motion.button
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${!notification.read ? 'bg-indigo-50/40' : ''}`}
                        whileHover={{ x: 2 }}
                      >
                        <div className={`w-9 h-9 rounded-xl ${config.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {!notification.read && <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{getTimeAgo(notification.createdAt)}</p>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="border-t border-gray-100 px-4 py-2">
              <p className="text-center">
                <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">
                  Voir toutes les notifications
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== NOTIFICATION ITEM ====================
function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const config = TYPE_CONFIG[notification.type]
  const Icon = config.icon

  const handleAction = async (value: string) => {
    await fetchJson(`/api/notifications/${notification.id}`, null, {
      method: 'PATCH',
      body: JSON.stringify({ action: value }),
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0 }}
      className={`relative group flex items-start gap-3 p-4 rounded-xl border transition-all ${
        !notification.read
          ? 'bg-indigo-50/50 border-indigo-100 shadow-sm'
          : 'bg-white border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${config.bgColor} ${config.color} border-0`}>
            {config.label}
          </Badge>
          {!notification.read && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
        </div>
        <h4 className={`text-sm mb-0.5 ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
          {notification.title}
        </h4>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notification.message}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-gray-400">{getTimeAgo(notification.createdAt)}</span>
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center gap-1.5">
              {notification.actions.map((action) => (
                <button
                  key={action.value}
                  onClick={() => handleAction(action.value)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                    action.value === 'accept'
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : action.value === 'refuse'
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500"
            title="Marquer comme lu"
          >
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

// ==================== SETTINGS PANEL ====================
function NotificationSettingsPanel({
  settings,
  onUpdate,
}: {
  settings: NotificationSettings
  onUpdate: (settings: NotificationSettings) => void
}) {
  const types: NotificationType[] = ['opportunity', 'reminder', 'system', 'achievement', 'social']
  const frequencies = [
    { value: 'instant', label: 'Immédiat' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-1">Types de notifications</h4>
        <p className="text-xs text-gray-500 mb-4">Choisissez les types que vous souhaitez recevoir.</p>
        <div className="space-y-3">
          {types.map((type) => {
            const config = TYPE_CONFIG[type]
            const Icon = config.icon
            return (
              <div key={type} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{config.label}</span>
                </div>
                <Switch
                  checked={settings.types[type]}
                  onCheckedChange={(checked) => {
                    onUpdate({
                      ...settings,
                      types: { ...settings.types, [type]: checked },
                    })
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-1">Fréquence de résumé</h4>
        <p className="text-xs text-gray-500 mb-4">Fréquence à laquelle vous recevez un résumé.</p>
        <div className="flex gap-2">
          {frequencies.map((f) => (
            <button
              key={f.value}
              onClick={() => onUpdate({ ...settings, frequency: f.value })}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                settings.frequency === f.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==================== MAIN NOTIFICATION CENTER ====================
export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    types: { opportunity: true, reminder: true, system: true, achievement: true, social: true },
    frequency: 'instant',
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const data = await fetchJson<Notification[]>('/api/notifications?unreadOnly=false', [])
      if (!cancelled) {
        setNotifications(data)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    await fetchJson(`/api/notifications/${id}`, null, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(async () => {
    await fetchJson('/api/notifications/read-all', null, { method: 'POST' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    await fetchJson(`/api/notifications/${id}`, null, { method: 'DELETE' })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread' && n.read) return false
    if (activeFilter !== 'all' && activeFilter !== 'unread' && n.type !== activeFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
    }
    return true
  })

  const groupedNotifications = filteredNotifications.reduce<Record<string, Notification[]>>((groups, n) => {
    const group = getDateGroup(n.createdAt)
    if (!groups[group]) groups[group] = []
    groups[group].push(n)
    return groups
  }, {})

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Centre de notifications</h1>
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                  : 'Vous êtes à jour !'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllRead}
                  className="rounded-xl text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                  Tout marquer comme lu
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className={`rounded-xl text-xs ${showSettings ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Paramètres
              </Button>
            </div>
          </motion.div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-6">
                    <NotificationSettingsPanel settings={settings} onUpdate={setSettings} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Filters */}
          <motion.div variants={fadeIn} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl border-gray-200 bg-white text-sm"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all shrink-0 ${
                    activeFilter === tab.value
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {tab.label}
                  {tab.value === 'unread' && unreadCount > 0 && (
                    <Badge className="ml-1.5 bg-red-500 text-white text-[9px] px-1 py-0 h-4 min-w-[16px] inline-flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Notification List */}
          <motion.div variants={fadeIn}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    {searchQuery ? (
                      <Search className="w-7 h-7 text-gray-400" />
                    ) : (
                      <Bell className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    {searchQuery ? 'Aucun résultat' : 'Aucune notification'}
                  </h3>
                  <p className="text-xs text-gray-400 text-center max-w-xs">
                    {searchQuery
                      ? 'Essayez avec d\'autres termes de recherche.'
                      : 'Vous n\'avez pas encore de notification. Revenez plus tard !'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {GROUP_ORDER.filter((g) => groupedNotifications[g]?.length).map((group) => (
                  <div key={group}>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                      {group}
                    </h3>
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {groupedNotifications[group].map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkRead={markAsRead}
                            onDelete={deleteNotification}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
