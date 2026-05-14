'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/hooks/use-store'
import { Zap, ArrowLeft, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const setView = useAppStore((s) => s.setView)
  const login = useAppStore((s) => s.login)
  const setRole = useAppStore((s) => s.setRole)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Stats data fetched from API for left panel
  const [statsData, setStatsData] = useState<Array<{ value: string; label: string }>>([])
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    setIsDev(window.location.hostname === 'localhost')

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStatsData([
          { value: data.totalUsers ? `${data.totalUsers.toLocaleString('fr-FR')}+` : '—', label: 'Diagnostics' },
          { value: '95%', label: 'Satisfaction' },
          { value: '12', label: 'Territoires' },
          { value: '7', label: 'Modules' },
        ])
      } catch {
        setStatsData([
          { value: '—', label: 'Diagnostics' },
          { value: '—', label: 'Satisfaction' },
          { value: '—', label: 'Territoires' },
          { value: '—', label: 'Modules' },
        ])
      }
    }
    fetchStats()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'register' && !termsAccepted) {
      setError('Vous devez accepter les conditions générales pour créer un compte.')
      setLoading(false)
      return
    }

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Erreur de connexion')
          setLoading(false)
          return
        }

        // Store JWT token in localStorage
        localStorage.setItem('cp_token', data.token)

        // Map Prisma role to frontend role
        const roleMap: Record<string, 'user' | 'counselor' | 'admin'> = {
          USER: 'user',
          COUNSELOR: 'counselor',
          ADMIN: 'admin',
        }
        const frontendRole = roleMap[data.user.role] || 'user'
        setRole(frontendRole)
        login(data.user.name, data.user.email, data.user.id)
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Erreur lors de la création du compte')
          setLoading(false)
          return
        }

        // Store JWT token in localStorage
        localStorage.setItem('cp_token', data.token)
        login(data.user.name, data.user.email, data.user.id)
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 mx-auto">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Bienvenue sur CréaScope
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed">
              Votre plateforme de diagnostic entrepreneurial propulsée par l&apos;intelligence artificielle.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-4 text-sm">
              {(statsData.length > 0 ? statsData : [
                { value: '—', label: 'Diagnostics' },
                { value: '—', label: 'Satisfaction' },
                { value: '—', label: 'Territoires' },
                { value: '—', label: 'Modules' },
              ]).map((item) => (
                <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-emerald-200">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Test accounts info - development only */}
            {isDev && (
              <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left">
                <p className="text-sm font-semibold text-emerald-100 mb-2">Comptes de test</p>
                <div className="space-y-1 text-xs text-emerald-200">
                  <p>Porteur : marie@example.com</p>
                  <p>Conseiller : conseiller@creapulse.fr</p>
                  <p>Admin : admin@creapulse.fr</p>
                  <p className="text-emerald-300 mt-1">Mot de passe : password123</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </button>

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              CréaScope
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-gray-500 mb-8">
            {mode === 'login'
              ? 'Connectez-vous pour accéder à votre espace'
              : 'Rejoignez CréaScope et lancez votre diagnostic'}
          </p>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Nom complet
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Marie Dupont"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
                Adresse e-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="marie@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </Label>
                {mode === 'login' && (
                  <button type="button" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="terms" className="text-xs text-gray-500">
                  J&apos;accepte les{' '}
                  <span className="text-emerald-600 font-medium cursor-pointer hover:underline">
                    conditions générales
                  </span>{' '}
                  et la{' '}
                  <span className="text-emerald-600 font-medium cursor-pointer hover:underline">
                    politique de confidentialité
                  </span>
                </label>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : mode === 'login' ? (
                'Se connecter'
              ) : (
                'Créer mon compte'
              )}
            </Button>
          </form>

          {/* Social login — coming soon */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">Connexion via Google et Microsoft disponible prochainement</span>
              </div>
            </div>
          </div>

          {/* Quick login buttons for testing - development only */}
          {isDev && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-3">Accès rapide (test)</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Porteur', email: 'marie@example.com', role: 'user' },
                  { label: 'Conseiller', email: 'conseiller@creapulse.fr', role: 'counselor' },
                  { label: 'Admin', email: 'admin@creapulse.fr', role: 'admin' },
                ].map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    onClick={async () => {
                      setLoading(true)
                      setError('')
                      try {
                        const res = await fetch('/api/auth/login', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: account.email, password: 'password123' }),
                        })
                        const data = await res.json()
                        if (res.ok) {
                          localStorage.setItem('cp_token', data.token)
                          const roleMap: Record<string, 'user' | 'counselor' | 'admin'> = {
                            USER: 'user', COUNSELOR: 'counselor', ADMIN: 'admin',
                          }
                          setRole(roleMap[data.user.role] || 'user')
                          login(data.user.name, data.user.email, data.user.id)
                        } else {
                          setError(data.error || 'Erreur')
                        }
                      } catch {
                        setError('Erreur réseau')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-white border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 transition-all"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggle login/register */}
          <p className="mt-8 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  onClick={() => { setMode('register'); setError('') }}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  onClick={() => { setMode('login'); setError('') }}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
