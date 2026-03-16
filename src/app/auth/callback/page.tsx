'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes — Supabase auto-detects hash fragment tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'Session:', !!session)

      if (event === 'PASSWORD_RECOVERY') {
        // User clicked password reset link — redirect to set password page
        window.location.href = '/set-password'
        return
      }

      if (event === 'SIGNED_IN' && session) {
        window.location.href = '/dashboard'
        return
      }
    })

    // Also check for PKCE code param
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError(true)
        }
        // If successful, onAuthStateChange will handle the redirect
      })
    }

    // Timeout fallback — if nothing happens in 8 seconds, show error
    const timeout = setTimeout(() => {
      const hash = window.location.hash
      if (!hash || !hash.includes('access_token')) {
        setError(true)
      }
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
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
