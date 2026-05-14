'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/hooks/use-store'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Accessibility,
  X,
  Type,
  Contrast,
  Minus,
  Eye,
  BookOpen,
  Pause,
  ChevronRight,
} from 'lucide-react'

export default function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { accessibility, updateAccessibility } = useAppStore()

  // Apply accessibility changes to document root
  useEffect(() => {
    const root = document.documentElement

    // Text size
    root.style.setProperty('--a11y-text-size', `${accessibility.textSize}%`)

    // Classes
    root.classList.toggle('a11y-high-contrast', accessibility.highContrast)
    root.classList.toggle('a11y-dyslexic-font', accessibility.dyslexicFont)
    root.classList.toggle('a11y-pause-animations', accessibility.pauseAnimations)

    return () => {
      root.classList.remove('a11y-high-contrast', 'a11y-dyslexic-font', 'a11y-pause-animations')
      root.style.removeProperty('--a11y-text-size')
    }
  }, [accessibility.highContrast, accessibility.dyslexicFont, accessibility.pauseAnimations, accessibility.textSize])

  // Reading line
  useEffect(() => {
    if (accessibility.readingLine) {
      const handleMouseMove = (e: MouseEvent) => {
        const line = document.querySelector('.reading-line-overlay') as HTMLElement
        if (line) {
          line.style.top = `${e.clientY - 1}px`
        }
      }
      document.documentElement.style.setProperty('--a11y-reading-line-opacity', '1')
      window.addEventListener('mousemove', handleMouseMove)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        document.documentElement.style.setProperty('--a11y-reading-line-opacity', '0')
      }
    } else {
      document.documentElement.style.setProperty('--a11y-reading-line-opacity', '0')
    }
  }, [accessibility.readingLine])

  // Reading mask
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--a11y-reading-mask-opacity',
      accessibility.readingMask ? '1' : '0'
    )
    return () => {
      document.documentElement.style.setProperty('--a11y-reading-mask-opacity', '0')
    }
  }, [accessibility.readingMask])

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const settings = [
    {
      id: 'textSize' as const,
      icon: Type,
      label: 'Taille du texte',
      description: `${accessibility.textSize}%`,
      type: 'slider' as const,
    },
    {
      id: 'highContrast' as const,
      icon: Contrast,
      label: 'Contraste élevé',
      description: 'Améliore la lisibilité',
      type: 'toggle' as const,
    },
    {
      id: 'readingLine' as const,
      icon: Minus,
      label: 'Ligne de lecture',
      description: 'Guide visuel horizontal',
      type: 'toggle' as const,
    },
    {
      id: 'readingMask' as const,
      icon: Eye,
      label: 'Masque de lecture',
      description: 'Focalise sur une zone',
      type: 'toggle' as const,
    },
    {
      id: 'dyslexicFont' as const,
      icon: BookOpen,
      label: 'Police dyslexique',
      description: 'Facilite la lecture',
      type: 'toggle' as const,
    },
    {
      id: 'pauseAnimations' as const,
      icon: Pause,
      label: 'Pause animations',
      description: 'Réduit les mouvements',
      type: 'toggle' as const,
    },
  ]

  return (
    <>
      {/* Floating button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-6 right-6 z-50"
      >
        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggle}
            className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-colors"
            aria-label="Paramètres d'accessibilité"
          >
            <Accessibility className="w-6 h-6" />
          </motion.button>
        )}
      </motion.div>

      {/* Panel overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={toggle}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-gray-900">Accessibilité</h2>
                </div>
                <button
                  onClick={toggle}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Settings */}
              <div className="flex-1 overflow-y-auto p-5 space-y-1 custom-scrollbar">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <setting.icon className="w-4.5 h-4.5 text-gray-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{setting.label}</p>
                        <p className="text-xs text-gray-400">{setting.description}</p>
                      </div>
                    </div>

                    {setting.type === 'toggle' ? (
                      <Switch
                        checked={accessibility[setting.id] as boolean}
                        onCheckedChange={(checked) =>
                          updateAccessibility({ [setting.id]: checked })
                        }
                      />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                ))}

                {/* Text size slider (only shows when textSize setting is visible) */}
                {accessibility.textSize !== 100 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="pt-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Aperçu</span>
                      <span className="text-xs font-semibold text-emerald-600">{accessibility.textSize}%</span>
                    </div>
                    <div
                      style={{ fontSize: `${accessibility.textSize * 0.16}px` }}
                      className="bg-gray-50 rounded-lg p-3 text-gray-700 leading-relaxed"
                    >
                      Exemple de texte avec la nouvelle taille.
                    </div>
                  </motion.div>
                )}

                {/* Text size slider always visible */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Taille du texte</span>
                    <span className="text-xs font-semibold text-emerald-600">{accessibility.textSize}%</span>
                  </div>
                  <Slider
                    value={[accessibility.textSize]}
                    onValueChange={([v]) => updateAccessibility({ textSize: v })}
                    min={100}
                    max={300}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>100%</span>
                    <span>200%</span>
                    <span>300%</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-100">
                <Button
                  onClick={() => {
                    updateAccessibility({
                      textSize: 100,
                      highContrast: false,
                      readingLine: false,
                      readingMask: false,
                      dyslexicFont: false,
                      pauseAnimations: false,
                    })
                  }}
                  variant="outline"
                  className="w-full rounded-xl text-sm"
                >
                  Réinitialiser les paramètres
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
