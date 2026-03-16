'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    if (typeof window !== 'undefined' && localStorage.getItem('pwa-install-dismissed')) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Also show on iOS Safari (no beforeinstallprompt)
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isIOS && !isStandalone) {
      setShowBanner(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  if (!showBanner || dismissed) return null

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slideUp">
      <div className="max-w-md mx-auto bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-500/30 rounded-2xl p-5 shadow-2xl shadow-purple-500/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">
              Instalar o Experimento
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              {isIOS
                ? 'Toque no botao de compartilhar e depois "Adicionar a Tela de Inicio".'
                : 'Adicione a tela inicial para uma experiencia completa.'}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-300 transition p-1"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-[0.98]"
          >
            Instalar
          </button>
        )}
      </div>
    </div>
  )
}
