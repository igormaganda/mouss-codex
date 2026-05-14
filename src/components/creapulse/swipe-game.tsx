'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useAppStore } from '@/hooks/use-store'

interface SkillCard {
  id: string
  title: string
  description: string
  icon: string
  color: string
}

const skills: SkillCard[] = [
  {
    id: 'leadership',
    title: 'Leadership',
    description: "Capacité à inspirer, motiver et guider une équipe vers un objectif commun. Prendre des décisions et assumer ses responsabilités.",
    icon: '👑',
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'creativite',
    title: 'Créativité',
    description: "Aptitude à générer des idées innovantes, penser hors des sentiers battus et apporter des solutions originales aux problèmes.",
    icon: '💡',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'stress',
    title: 'Gestion du stress',
    description: "Savoir rester calme et performant sous pression. Gérer les émotions et maintenir un équilibre dans les situations difficiles.",
    icon: '🧘',
    color: 'from-sky-400 to-blue-500',
  },
  {
    id: 'communication',
    title: 'Communication',
    description: "Capacité à transmettre clairement ses idées, écouter activement et adapter son discours à différents interlocuteurs.",
    icon: '🗣️',
    color: 'from-violet-400 to-purple-500',
  },
  {
    id: 'resolution',
    title: 'Résolution de problèmes',
    description: "Analyser les situations complexes, identifier les causes et mettre en œuvre des solutions efficaces de manière structurée.",
    icon: '🧩',
    color: 'from-rose-400 to-pink-500',
  },
]

export default function SwipeGame() {
  const userId = useAppStore((s) => s.userId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<Record<string, 'yes' | 'no'>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch existing results from API on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/modules/pepites?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const restored: Record<string, 'yes' | 'no'> = {}
            let maxIdx = -1
            for (const r of data) {
              const idx = skills.findIndex((s) => s.id === r.skillId)
              if (idx >= 0) {
                restored[r.skillId] = r.kept ? 'yes' : 'no'
                if (idx > maxIdx) maxIdx = idx
              }
            }
            setResults(restored)
            if (maxIdx + 1 >= skills.length) {
              setIsFinished(true)
            } else {
              setCurrentIndex(maxIdx + 1)
            }
          }
        }
      } catch {
        // silent — fallback to fresh state
      } finally {
        setIsLoading(false)
      }
    }
    fetchResults()
  }, [userId])

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18])
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  const currentSkill = skills[currentIndex]

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentSkill) return
      setExitDirection(direction)
      const decision: 'yes' | 'no' = direction === 'right' ? 'yes' : 'no'
      const newResults = { ...results, [currentSkill.id]: decision }
      setResults(newResults)

      // Persist result to API
      if (userId) {
        const payload = Object.entries(newResults).map(([skillId, dec]) => {
          const skill = skills.find((s) => s.id === skillId)
          return { skillId, skillName: skill?.title || skillId, kept: dec === 'yes' }
        })
        fetch('/api/modules/pepites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, skills: payload }),
        }).catch(() => { /* silent */ })
      }

      setTimeout(() => {
        if (currentIndex + 1 >= skills.length) {
          setIsFinished(true)
        } else {
          setCurrentIndex((prev) => prev + 1)
        }
        setExitDirection(null)
        x.set(0)
      }, 300)
    },
    [currentSkill, currentIndex, x, results, userId]
  )

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      handleSwipe('right')
    } else if (info.offset.x < -100) {
      handleSwipe('left')
    }
  }

  const reset = () => {
    setCurrentIndex(0)
    setResults({})
    setIsFinished(false)
    setExitDirection(null)
    x.set(0)
  }

  const yesCount = Object.values(results).filter((v) => v === 'yes').length
  const totalAnswered = Object.keys(results).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Jeu terminé !
          </h3>
          <p className="text-gray-500">
            Vous avez sélectionné <span className="font-semibold text-emerald-600">{yesCount}</span> compétences sur{' '}
            {totalAnswered}.
          </p>
        </motion.div>

        <div className="grid grid-cols-5 gap-2 mb-8">
          {skills.map((skill) => (
            <motion.div
              key={skill.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: skills.indexOf(skill) * 0.1 }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl ${
                results[skill.id] === 'yes'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="text-2xl">{skill.icon}</span>
              <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                {skill.title}
              </span>
              <span className="text-lg">
                {results[skill.id] === 'yes' ? '✅' : '❌'}
              </span>
            </motion.div>
          ))}
        </div>

        <Button
          onClick={reset}
          variant="outline"
          className="rounded-full px-6"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Recommencer
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex gap-1.5">
          {skills.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < currentIndex
                  ? 'bg-emerald-400'
                  : i === currentIndex
                    ? 'bg-emerald-600'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 font-medium">
          {currentIndex + 1} / {skills.length}
        </span>
      </div>

      {/* Card stack */}
      <div className="relative w-full max-w-sm h-80">
        <AnimatePresence mode="popLayout">
          {currentSkill && (
            <motion.div
              key={currentSkill.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x, rotate, touchAction: 'none' }}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: exitDirection ? (exitDirection === 'right' ? 1.1 : 0.9) : 1,
                opacity: exitDirection ? 0 : 1,
                x: exitDirection ? (exitDirection === 'right' ? 300 : -300) : 0,
                rotate: exitDirection ? (exitDirection === 'right' ? 20 : -20) : 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
              className="swipe-card absolute inset-0 rounded-2xl shadow-lg border border-gray-100 overflow-hidden bg-white cursor-grab active:cursor-grabbing"
            >
              <div
                className={`h-full bg-gradient-to-br ${currentSkill.color} p-6 flex flex-col justify-between relative`}
              >
                {/* Like/Nope overlays */}
                <motion.div
                  style={{ opacity: likeOpacity }}
                  className="absolute top-6 right-6 bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold text-lg rotate-12 border-3 border-emerald-600 shadow-lg"
                >
                  PÉPITE ✓
                </motion.div>
                <motion.div
                  style={{ opacity: nopeOpacity }}
                  className="absolute top-6 left-6 bg-red-500 text-white px-4 py-1.5 rounded-lg font-bold text-lg -rotate-12 border-3 border-red-600 shadow-lg"
                >
                  PASS ✗
                </motion.div>

                <div className="flex-1 flex flex-col items-center justify-center text-white">
                  <span className="text-6xl mb-4">{currentSkill.icon}</span>
                  <h3 className="text-2xl font-bold mb-3">{currentSkill.title}</h3>
                  <p className="text-white/90 text-sm text-center leading-relaxed max-w-xs">
                    {currentSkill.description}
                  </p>
                </div>

                <p className="text-center text-white/70 text-xs">
                  Glissez à droite pour garder, à gauche pour passer
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4 mt-6">
        <Button
          onClick={() => handleSwipe('left')}
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 p-0 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <ThumbsDown className="w-5 h-5 text-red-500" />
        </Button>
        <Button
          onClick={() => handleSwipe('right')}
          size="lg"
          className="rounded-full w-14 h-14 p-0 bg-emerald-600 hover:bg-emerald-700"
        >
          <ThumbsUp className="w-5 h-5 text-white" />
        </Button>
      </div>
    </div>
  )
}
