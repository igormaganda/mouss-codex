'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CollaborationPanel from './collaboration-panel'
import GoNoGoPanel from './go-nogo-panel'
import EntretienPanel from './entretien-panel'
import NotesPanel from './notes-panel'
import SynthesePanel from './synthese-panel'
import {
  Bot,
  MessageSquareText,
  FileOutput,
  Search,
  Sparkles,
  FileText,
  Send,
  TrendingUp,
  ArrowRight,
  Download,
  Loader2,
  CheckCircle2,
  ClipboardList,
  Scale,
  FileBarChart,
  Users,
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// ====================== AI COPILOT TAB ======================
interface ChatMessage {
  role: 'ai' | 'user'
  content: string
  time: string
  loading?: boolean
}

function AICopilotTab() {
  const userName = useAppStore((s) => s.userName)
  const currentRole = useAppStore((s) => s.currentRole)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: "Bonjour ! Je suis l'IA Co-Pilote de CréaScope, propulsée par Claude. Je peux analyser des profils entrepreneuriaux, recommander des formations et vous aider dans vos diagnostics. Comment puis-je vous aider ?", time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    const userMessage: ChatMessage = { role: 'user', content: inputValue.trim(), time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    const loadingMsg: ChatMessage = { role: 'ai', content: '...', time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), loading: true }
    setMessages((prev) => [...prev, loadingMsg])

    try {
      const apiMessages = [...messages.filter((m) => !m.loading).map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })), { role: 'user', content: userMessage.content }]
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: apiMessages, context: { userName: userName || 'Conseiller CréaScope', userRole: currentRole.toUpperCase() } }) })
      const data = await res.json()
      if (res.ok) {
        setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: data.content, loading: false } : m))
      } else {
        setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: 'Désolé, une erreur est survenue.', loading: false } : m))
      }
    } catch {
      setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: 'Erreur de connexion.', loading: false } : m))
    } finally { setIsLoading(false) }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">IA Co-Pilote</CardTitle>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">Claude — En ligne</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">Analyse en temps réel des profils entrepreneuriaux avec suggestions contextuelles.</p>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-3 mb-4">
              {messages.map((msg, i) => (
                msg.role === 'ai' ? (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                      {msg.loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Sparkles className="w-4 h-4 text-white" />}
                    </div>
                    <div className="bg-gray-50 rounded-xl rounded-tl-sm p-3 max-w-lg">
                      {msg.loading ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {!msg.loading && <p className="text-[10px] text-gray-400 mt-1">{msg.time}</p>}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-violet-600">CP</span></div>
                    <div className="bg-violet-50 rounded-xl rounded-tr-sm p-3 max-w-lg">
                      <p className="text-sm text-gray-700">{msg.content}</p>
                      <p className="text-[10px] text-gray-400 mt-1 text-right">{msg.time}</p>
                    </div>
                  </motion.div>
                )
              ))}
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Posez une question à Claude..." className="flex-1 rounded-xl border-gray-200 h-10" disabled={isLoading} />
              <Button size="icon" onClick={sendMessage} disabled={isLoading || !inputValue.trim()} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 h-10 w-10"><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== CHAT MARCHÉ TAB ======================
interface MarketItem {
  title: string
  source: string
  summary: string
  url: string
  date: string
}

function ChatMarcheTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [marketData, setMarketData] = useState<MarketItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        setIsLoading(true)
        try {
          const res = await fetch('/api/market-analysis/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery, sector: searchQuery }),
          })
          if (res.ok) {
            const data = await res.json()
            const analysis = data.analysis
            if (analysis) {
              const items: MarketItem[] = []
              // Add market size info
              if (analysis.marketSize) {
                items.push({
                  title: `Taille du marché : ${analysis.marketSize.value || 'N/A'}`,
                  source: 'Analyse IA',
                  summary: `Tendance : ${analysis.marketSize.trend || 'stable'}, Croissance : ${analysis.marketSize.growth || 'N/A'}`,
                  url: '#',
                  date: new Date().toLocaleDateString('fr-FR'),
                })
              }
              // Add trends
              if (analysis.trends && Array.isArray(analysis.trends)) {
                analysis.trends.slice(0, 4).forEach((t: { trend: string; impact: string }) => {
                  items.push({
                    title: t.trend,
                    source: 'Tendance marché',
                    summary: `Impact : ${t.impact}`,
                    url: '#',
                    date: new Date().toLocaleDateString('fr-FR'),
                  })
                })
              }
              // Add opportunities
              if (analysis.opportunities && Array.isArray(analysis.opportunities)) {
                analysis.opportunities.slice(0, 3).forEach((o: string) => {
                  items.push({
                    title: o,
                    source: 'Opportunité',
                    summary: 'Opportunité identifiée par l\'analyse de marché',
                    url: '#',
                    date: new Date().toLocaleDateString('fr-FR'),
                  })
                })
              }
              // Add synthesis as last item
              if (analysis.synthesis) {
                items.push({
                  title: 'Synthèse de l\'analyse',
                  source: 'Analyse IA CréaScope',
                  summary: analysis.synthesis,
                  url: '#',
                  date: new Date().toLocaleDateString('fr-FR'),
                })
              }
              setMarketData(items)
            } else {
              setMarketData([])
            }
          }
        } catch {
          setMarketData([])
        } finally {
          setIsLoading(false)
          setHasSearched(true)
        }
      }, 500)
      return () => clearTimeout(timer)
    } else if (searchQuery.trim().length === 0) {
      setMarketData([])
      setHasSearched(false)
    }
  }, [searchQuery])

  const filteredData = marketData.filter((d) => searchQuery ? d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.summary.toLowerCase().includes(searchQuery.toLowerCase()) : true)

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2"><MessageSquareText className="w-5 h-5 text-violet-500" /><CardTitle className="text-base">Chat Marché</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un secteur..." className="pl-10 h-10 rounded-xl border-gray-200" />
            </div>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Recherche en cours...</span>
              </div>
            )}
            {!isLoading && hasSearched && filteredData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">Aucun résultat trouvé pour &laquo;{searchQuery}&raquo;</p>
                <p className="text-xs text-gray-400 mt-1">Essayez un autre terme de recherche</p>
              </div>
            )}
            {!isLoading && !hasSearched && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">Saisissez au moins 2 caractères pour rechercher un secteur</p>
              </div>
            )}
            <div className="space-y-3">{filteredData.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl border border-gray-100 hover:border-violet-200 transition-all cursor-pointer group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{d.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.summary}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">{d.source} · {d.date}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0 mt-0.5" />
                </div>
              </motion.div>
            ))}</div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== LIVRABLES TAB ======================
function LivrablesTab() {
  const userId = useAppStore((s) => s.userId)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [generatingFin, setGeneratingFin] = useState(false)
  const [planGenerated, setPlanGenerated] = useState(false)
  const [finGenerated, setFinGenerated] = useState(false)
  const [existingLivrables, setExistingLivrables] = useState<Array<{
    id: string
    type: string
    title: string
    status: string
  }>>([])
  const [isLoadingLivrables, setIsLoadingLivrables] = useState(false)

  // Fetch existing livrables on mount
  useEffect(() => {
    if (!userId) return
    const fetchLivrables = async () => {
      setIsLoadingLivrables(true)
      try {
        const res = await fetch(`/api/livrables?counselorId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          const livs = data.livrables || []
          setExistingLivrables(livs)
          // Set generated flags if matching completed livrables exist
          const hasPlan = livs.some((l: { type: string; status: string }) => l.type === 'ACTION_PLAN' && l.status === 'COMPLETED')
          const hasFin = livs.some((l: { type: string; status: string }) => l.type === 'FINANCIAL_FORECAST' && l.status === 'COMPLETED')
          if (hasPlan) setPlanGenerated(true)
          if (hasFin) setFinGenerated(true)
        }
      } catch {
        // Silently fail - user can still generate
      } finally {
        setIsLoadingLivrables(false)
      }
    }
    fetchLivrables()
  }, [userId])

  const handleGenerate = async (type: 'plan' | 'fin') => {
    if (!userId) return
    const livType = type === 'plan' ? 'ACTION_PLAN' : 'FINANCIAL_FORECAST'

    if (type === 'plan') {
      setGeneratingPlan(true)
    } else {
      setGeneratingFin(true)
    }

    try {
      const res = await fetch('/api/livrables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: livType, counselorId: userId }),
      })
      if (res.ok) {
        const data = await res.json()
        const livrable = data.livrable
        // Poll for completion (simulated)
        const pollInterval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/livrables?counselorId=${userId}`)
            if (checkRes.ok) {
              const checkData = await checkRes.json()
              const updated = (checkData.livrables || []).find((l: { id: string }) => l.id === livrable.id)
              if (updated && updated.status === 'COMPLETED') {
                clearInterval(pollInterval)
                if (type === 'plan') {
                  setGeneratingPlan(false)
                  setPlanGenerated(true)
                } else {
                  setGeneratingFin(false)
                  setFinGenerated(true)
                }
              }
            }
          } catch {
            // Continue polling
          }
        }, 1500)
        // Fallback timeout after 10s
        setTimeout(() => {
          clearInterval(pollInterval)
          if (type === 'plan') {
            setGeneratingPlan(false)
            setPlanGenerated(true)
          } else {
            setGeneratingFin(false)
            setFinGenerated(true)
          }
        }, 10000)
      } else {
        if (type === 'plan') setGeneratingPlan(false)
        else setGeneratingFin(false)
      }
    } catch {
      if (type === 'plan') setGeneratingPlan(false)
      else setGeneratingFin(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeIn}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2"><FileOutput className="w-5 h-5 text-emerald-500" /><CardTitle className="text-base">Génération de livrables</CardTitle></div>
            {isLoadingLivrables && (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                <span className="text-xs text-gray-400">Chargement des livrables existants...</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center"><FileText className="w-6 h-6 text-emerald-600" /></div>
                <div><p className="font-semibold text-gray-900 text-sm">Plan d&apos;actions</p><p className="text-xs text-gray-500">Synthèse personnalisée des recommandations</p></div>
              </div>
              {planGenerated ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="w-4 h-4" /><span className="text-sm font-semibold">Document généré</span></div>
                  <Button size="sm" variant="outline" className="mt-2 rounded-full border-emerald-200 text-emerald-700"><Download className="w-3.5 h-3.5 mr-1.5" /> Télécharger</Button>
                </motion.div>
              ) : <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center"><p className="text-xs text-gray-400">Le document sera généré en PDF</p></div>}
              <Button onClick={() => handleGenerate('plan')} disabled={generatingPlan || planGenerated} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                {generatingPlan ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</> : <><Sparkles className="w-4 h-4 mr-2" /> Générer le plan</>}
              </Button>
            </div>
            <div className="border border-gray-100 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-violet-600" /></div>
                <div><p className="font-semibold text-gray-900 text-sm">Prévisionnel financier</p><p className="text-xs text-gray-500">Projections sur 3 ans avec tableaux</p></div>
              </div>
              {finGenerated ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-violet-700"><CheckCircle2 className="w-4 h-4" /><span className="text-sm font-semibold">Document généré</span></div>
                  <Button size="sm" variant="outline" className="mt-2 rounded-full border-violet-200 text-violet-700"><Download className="w-3.5 h-3.5 mr-1.5" /> Télécharger</Button>
                </motion.div>
              ) : <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center"><p className="text-xs text-gray-400">Le document sera généré en Excel</p></div>}
              <Button onClick={() => handleGenerate('fin')} disabled={generatingFin || finGenerated} className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                {generatingFin ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</> : <><Sparkles className="w-4 h-4 mr-2" /> Générer le prévisionnel</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ====================== MAIN COUNSELOR DASHBOARD ======================
export default function CounselorDashboard() {
  const counselorTab = useAppStore((s) => s.counselorTab)
  const setCounselorTab = useAppStore((s) => s.setCounselorTab)

  return (
    <Tabs value={counselorTab} onValueChange={(v) => setCounselorTab(v as typeof counselorTab)} className="space-y-6">
      <TabsList className="bg-gray-100 p-1 rounded-xl h-auto flex-wrap gap-1">
        {[
          { value: 'entretien', icon: ClipboardList, label: 'Entretien' },
          { value: 'ai-copilote', icon: Bot, label: 'IA Co-Pilote' },
          { value: 'notes', icon: FileText, label: 'Notes' },
          { value: 'chat-marche', icon: MessageSquareText, label: 'Chat Marché' },
          { value: 'go-nogo', icon: Scale, label: 'Go/No-Go' },
          { value: 'livrables', icon: FileOutput, label: 'Livrables' },
          { value: 'collaboration', icon: Users, label: 'Collaboration' },
          { value: 'synthese', icon: FileBarChart, label: 'Synthèse' },
        ].map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-3 py-2">
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="entretien"><EntretienPanel /></TabsContent>
      <TabsContent value="ai-copilote"><AICopilotTab /></TabsContent>
      <TabsContent value="notes"><NotesPanel /></TabsContent>
      <TabsContent value="chat-marche"><ChatMarcheTab /></TabsContent>
      <TabsContent value="go-nogo"><GoNoGoPanel /></TabsContent>
      <TabsContent value="livrables"><LivrablesTab /></TabsContent>
      <TabsContent value="collaboration"><CollaborationPanel /></TabsContent>
      <TabsContent value="synthese"><SynthesePanel /></TabsContent>
    </Tabs>
  )
}
