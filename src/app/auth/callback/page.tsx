'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Auth callback page — handles Supabase email link redirects.
 *
 * Supabase password reset emails send tokens as URL hash fragments:
 *   /auth/callback#access_token=xxx&refresh_token=yyy&type=recovery
 *
 * Hash fragments are NOT sent to the server, so this must be a client-side page.
 * The Supabase client automatically picks up the tokens from the hash.
 */
export default function AuthCallbackPage() {
  const [error, setError] = useState(false)

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()

      // Check for hash params (password reset flow)
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Supabase client auto-detects hash tokens and sets the session
        // We just need to wait a moment for it to process
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          // Try once more after a short delay
          await new Promise(resolve => setTimeout(resolve, 1000))
          const { data: { session: retrySession } } = await supabase.auth.getSession()

          if (retrySession) {
            // Check if this is a recovery (password reset) flow
            const isRecovery = hash.includes('type=recovery')
            window.location.href = isRecovery ? '/set-password' : '/dashboard'
            return
          }

          setError(true)
          return
        }

        const isRecovery = hash.includes('type=recovery')
        window.location.href = isRecovery ? '/set-password' : '/dashboard'
        return
      }

      // Check for code param (PKCE flow)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const next = params.get('next') || '/dashboard'

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!exchangeError) {
          window.location.href = next
          return
        }
      }

      // No valid auth params found
      setError(true)
    }

    handleCallback()
  }, [])

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Link expirado ou inválido</h1>
          <p className="text-gray-400 text-sm">Peça um novo link de redefinição de senha.</p>
          <a
            href="/login"
            className="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition"
          >
            Ir para o Login
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <div className="flex gap-1 justify-center">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
        <p className="text-gray-400 text-sm">Verificando autenticação...</p>
      </div>
    </main>
  )
}
