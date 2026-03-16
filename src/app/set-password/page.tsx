'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [visible, setVisible] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    setVisible(true)

    // Get current user name
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.nome) {
        setUserName(user.user_metadata.nome.split(' ')[0])
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError('Erro ao definir senha. Tente novamente ou peça um novo link.')
      console.error('Update password error:', updateError)
    } else {
      setSuccess(true)
      setMessage('Senha criada com sucesso!')
      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 3000)
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {success ? 'Tudo pronto!' : 'Crie sua Senha'}
          </h1>
          <p className="text-gray-400">
            {success
              ? 'Você será redirecionada ao experimento em instantes...'
              : userName
                ? `${userName}, defina uma senha para acessar o experimento.`
                : 'Defina uma senha segura para acessar o experimento.'
            }
          </p>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-green-300 font-medium">{message}</p>
            <p className="text-gray-400 text-sm mt-2">Redirecionando para o experimento...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nova Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                required
                minLength={6}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 animate-fadeIn">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Criando senha...' : 'Criar Senha'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
