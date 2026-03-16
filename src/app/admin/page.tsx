'use client'

import { useEffect, useState } from 'react'
import { ETAPAS } from '@/lib/etapas'

export default function AdminPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [contexto, setContexto] = useState('')
  const [contextos, setContextos] = useState<any[]>([])
  const [respostas, setRespostas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')

  // Session creation
  const [newUser1Email, setNewUser1Email] = useState('')
  const [newUser2Email, setNewUser2Email] = useState('')

  // Participant profiles
  const [perfilTextos, setPerfilTextos] = useState<Record<string, string>>({})
  const [perfilSaving, setPerfilSaving] = useState<Record<string, boolean>>({})

  // User management (email/password)
  const [userEdits, setUserEdits] = useState<Record<string, { email: string; password: string; nome: string }>>({})
  const [userSaving, setUserSaving] = useState<Record<string, boolean>>({})

  // Respond as user
  const [respondAsUser, setRespondAsUser] = useState('')
  const [respondSession, setRespondSession] = useState('')
  const [respondEtapa, setRespondEtapa] = useState(1)
  const [respondTexto, setRespondTexto] = useState('')

  useEffect(() => { loadData() }, [])

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/data')
      const data = await res.json()
      if (data.error) {
        showMessage(data.error, 'error')
      } else {
        setSessions(data.sessions || [])
        setProfiles(data.profiles || [])
        setContextos(data.contextos || [])

        // Load existing profile contexts into perfilTextos
        const perfis: Record<string, string> = {}
        for (const c of (data.contextos || [])) {
          if (c.user_id && c.contexto?.startsWith('[PERFIL] ')) {
            perfis[c.user_id] = c.contexto.replace('[PERFIL] ', '')
          }
        }
        setPerfilTextos(prev => ({ ...prev, ...perfis }))

        // Initialize user edit fields from profiles
        const edits: Record<string, { email: string; password: string; nome: string }> = {}
        for (const p of (data.profiles || [])) {
          edits[p.id] = { email: p.email || '', password: '', nome: p.nome || '' }
        }
        setUserEdits(prev => ({ ...prev, ...edits }))
      }
    } catch {
      showMessage('Erro ao carregar dados', 'error')
    }
    setLoading(false)
  }

  const loadRespostas = async (sessionId: string) => {
    const res = await fetch(`/api/admin/respostas?session_id=${sessionId}`)
    const data = await res.json()
    setRespostas(data.respostas || [])
  }

  useEffect(() => {
    if (selectedSession) loadRespostas(selectedSession)
  }, [selectedSession])

  const handleCreateSession = async () => {
    if (!newUser1Email || !newUser2Email) { showMessage('Preencha ambos os emails', 'error'); return }
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user1_email: newUser1Email, user2_email: newUser2Email, etapa_atual: 1 }),
    })
    const data = await res.json()
    showMessage(data.message || data.error || 'Sessão criada!', data.error ? 'error' : 'success')
    loadData()
  }

  const handleAddContext = async () => {
    if (!selectedSession || !contexto) { showMessage('Selecione sessão e escreva o contexto', 'error'); return }
    const res = await fetch('/api/admin/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: selectedSession, user_id: selectedUser || null, contexto }),
    })
    const data = await res.json()
    showMessage(data.message || 'Contexto adicionado!', 'success')
    setContexto('')
    loadData()
  }

  const handleUpdateEtapa = async (sessionId: string, novaEtapa: number) => {
    const res = await fetch('/api/admin/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, etapa_atual: novaEtapa }),
    })
    const data = await res.json()
    showMessage(data.message || 'Etapa atualizada!', 'success')
    loadData()
  }

  const handleDeleteResposta = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta resposta? Os índices dessa etapa também serão apagados.')) return
    const res = await fetch('/api/admin/respostas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    showMessage(data.message || data.error, data.error ? 'error' : 'success')
    if (selectedSession) loadRespostas(selectedSession)
  }

  const handleRespondAsUser = async () => {
    if (!respondSession || !respondAsUser || !respondTexto.trim()) {
      showMessage('Preencha todos os campos', 'error'); return
    }
    const res = await fetch('/api/admin/respostas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: respondSession,
        user_id: respondAsUser,
        etapa: respondEtapa,
        resposta: respondTexto,
      }),
    })
    const data = await res.json()
    showMessage(data.message || data.error, data.error ? 'error' : 'success')
    setRespondTexto('')
    if (selectedSession) loadRespostas(selectedSession)
  }

  const handleUpdateUser = async (userId: string) => {
    const edit = userEdits[userId]
    if (!edit) return

    const profile = profiles.find((p: any) => p.id === userId)
    const hasEmailChange = edit.email && edit.email !== profile?.email
    const hasPasswordChange = edit.password.trim().length > 0
    const hasNomeChange = edit.nome && edit.nome !== profile?.nome

    if (!hasEmailChange && !hasPasswordChange && !hasNomeChange) {
      showMessage('Nenhuma alteração detectada', 'info')
      return
    }

    if (hasPasswordChange && edit.password.length < 6) {
      showMessage('A senha deve ter pelo menos 6 caracteres', 'error')
      return
    }

    setUserSaving(prev => ({ ...prev, [userId]: true }))

    const body: Record<string, any> = { user_id: userId }
    if (hasEmailChange) body.email = edit.email
    if (hasPasswordChange) body.password = edit.password
    if (hasNomeChange) body.nome = edit.nome

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    showMessage(data.message || data.error, data.error ? 'error' : 'success')

    // Clear password field after save
    setUserEdits(prev => ({ ...prev, [userId]: { ...prev[userId], password: '' } }))
    setUserSaving(prev => ({ ...prev, [userId]: false }))
    loadData()
  }

  const handleSavePerfil = async (userId: string) => {
    const texto = perfilTextos[userId]?.trim()
    if (!texto) { showMessage('Escreva o perfil do participante', 'error'); return }
    setPerfilSaving(prev => ({ ...prev, [userId]: true }))

    // Delete existing profile context for this user
    const res = await fetch('/api/admin/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessions[0]?.id || null,
        user_id: userId,
        contexto: `[PERFIL] ${texto}`,
      }),
    })
    const data = await res.json()
    showMessage(data.message || 'Perfil salvo!', data.error ? 'error' : 'success')
    setPerfilSaving(prev => ({ ...prev, [userId]: false }))
    loadData()
  }

  const getProfileName = (userId: string) => {
    const p = profiles.find(p => p.id === userId)
    return p ? p.nome : userId?.slice(0, 8)
  }

  const getEtapaTitulo = (etapa: number) => {
    const e = ETAPAS.find(e => e.numero === etapa)
    return e ? e.titulo : `Etapa ${etapa}`
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-gray-400">Carregando...</div>

  const msgColor = messageType === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-300'
    : messageType === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-300'
    : 'bg-purple-500/10 border-purple-500/20 text-purple-300'

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">🔧 Painel Admin</h1>
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">← Voltar ao app</a>
        </div>

        {message && (
          <div className={`border rounded-xl p-4 animate-fadeIn ${msgColor}`}>
            {message}
          </div>
        )}

        {/* ===== CRIAR SESSÃO ===== */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">🔗 Criar Sessão</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={newUser1Email} onChange={(e) => setNewUser1Email(e.target.value)}
              placeholder="Email Participante 1"
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            />
            <input
              value={newUser2Email} onChange={(e) => setNewUser2Email(e.target.value)}
              placeholder="Email Participante 2"
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            />
          </div>
          <button onClick={handleCreateSession} className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition font-medium">
            Criar Sessão
          </button>
        </div>

        {/* ===== GERENCIAR USUÁRIOS ===== */}
        {profiles.length > 0 && (
          <div className="bg-slate-900/50 border border-emerald-800/30 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">👤 Gerenciar Usuários</h2>
              <p className="text-gray-400 text-sm mt-2">
                Altere o nome, email e senha dos participantes. A senha só é alterada se preenchida.
              </p>
            </div>

            {profiles.map((p: any) => {
              const edit = userEdits[p.id] || { email: '', password: '', nome: '' }
              return (
                <div key={p.id} className="bg-slate-800/70 rounded-xl p-5 space-y-4 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                      {(p.nome || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{p.nome || 'Sem nome'}</h3>
                      <p className="text-gray-500 text-xs font-mono">{p.id.slice(0, 12)}...</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1 block">Nome</label>
                      <input
                        value={edit.nome}
                        onChange={(e) => setUserEdits(prev => ({ ...prev, [p.id]: { ...prev[p.id], nome: e.target.value } }))}
                        placeholder="Nome completo"
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1 block">Email</label>
                      <input
                        type="email"
                        value={edit.email}
                        onChange={(e) => setUserEdits(prev => ({ ...prev, [p.id]: { ...prev[p.id], email: e.target.value } }))}
                        placeholder="novo@email.com"
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                        Nova Senha
                        <span className="text-gray-600 normal-case tracking-normal">(deixe vazio para manter)</span>
                      </label>
                      <input
                        type="password"
                        value={edit.password}
                        onChange={(e) => setUserEdits(prev => ({ ...prev, [p.id]: { ...prev[p.id], password: e.target.value } }))}
                        placeholder="••••••••"
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleUpdateUser(p.id)}
                      disabled={userSaving[p.id]}
                      className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition font-medium text-sm disabled:opacity-50"
                    >
                      {userSaving[p.id] ? 'Salvando...' : `Salvar Alterações`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ===== SESSÕES ATIVAS ===== */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">📋 Sessões Ativas</h2>
          {sessions.map((s: any) => (
            <div key={s.id} className="bg-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-white text-sm font-mono">{s.id.slice(0, 12)}...</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {getProfileName(s.user1_id)} ↔ {getProfileName(s.user2_id)} | Status: <span className={s.status === 'ativo' ? 'text-green-400' : 'text-blue-400'}>{s.status}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-xs mr-2">Etapa:</span>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n} onClick={() => handleUpdateEtapa(s.id, n)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition ${
                        s.etapa_atual >= n ? 'bg-purple-500 text-white' : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-gray-500 text-sm">Nenhuma sessão criada ainda.</p>}
        </div>

        {/* ===== PERFIL DOS PARTICIPANTES ===== */}
        {profiles.length > 0 && (
          <div className="bg-slate-900/50 border border-indigo-800/30 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">🧬 Perfil dos Participantes</h2>
              <p className="text-gray-400 text-sm mt-2">
                Descreva o comportamento, personalidade, interesses e padrões de cada participante.
                Eros usará essas informações para personalizar todas as interações (saudações, dicas, chat e análises).
              </p>
            </div>

            {profiles.map((p: any) => (
              <div key={p.id} className="bg-slate-800/70 rounded-xl p-5 space-y-3 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {(p.nome || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{p.nome || 'Sem nome'}</h3>
                    <p className="text-gray-500 text-xs">{p.email}</p>
                  </div>
                </div>

                <textarea
                  value={perfilTextos[p.id] || ''}
                  onChange={(e) => setPerfilTextos(prev => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder={`Descreva ${p.nome?.split(' ')[0] || 'o participante'}... Ex: Personalidade introspectiva, gosta de filosofia estoica, é analítico, tende a racionalizar emoções, valoriza autenticidade...`}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 resize-none focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-sm leading-relaxed"
                  rows={4}
                />

                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-xs">
                    {perfilTextos[p.id]?.length || 0} caracteres
                  </p>
                  <button
                    onClick={() => handleSavePerfil(p.id)}
                    disabled={perfilSaving[p.id]}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition font-medium text-sm disabled:opacity-50"
                  >
                    {perfilSaving[p.id] ? 'Salvando...' : `Salvar Perfil de ${p.nome?.split(' ')[0] || 'Participante'}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== RESPONDER COMO USUÁRIO ===== */}
        <div className="bg-slate-900/50 border border-yellow-800/30 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">🎭 Responder como Usuário</h2>
          <p className="text-gray-400 text-sm">Simule uma resposta de qualquer participante em qualquer etapa. Se já existir resposta, ela será substituída.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select value={respondSession} onChange={(e) => setRespondSession(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500/50 focus:outline-none">
              <option value="">Sessão</option>
              {sessions.map((s: any) => (
                <option key={s.id} value={s.id}>{s.id.slice(0, 8)}... ({getProfileName(s.user1_id)} ↔ {getProfileName(s.user2_id)})</option>
              ))}
            </select>

            <select value={respondAsUser} onChange={(e) => setRespondAsUser(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500/50 focus:outline-none">
              <option value="">Responder como...</option>
              {profiles.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nome} ({p.email})</option>
              ))}
            </select>

            <select value={respondEtapa} onChange={(e) => setRespondEtapa(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500/50 focus:outline-none">
              {ETAPAS.map(e => (
                <option key={e.numero} value={e.numero}>Etapa {e.numero} - {e.titulo}</option>
              ))}
            </select>
          </div>

          {respondEtapa && (
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-purple-400 text-xs font-semibold uppercase mb-1">Pergunta da Etapa {respondEtapa}:</p>
              <p className="text-gray-300 text-sm italic">{ETAPAS.find(e => e.numero === respondEtapa)?.pergunta}</p>
            </div>
          )}

          <textarea
            value={respondTexto} onChange={(e) => setRespondTexto(e.target.value)}
            placeholder="Escreva a resposta como se fosse o participante selecionado..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 resize-none focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
            rows={3}
          />

          <button onClick={handleRespondAsUser}
            className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-500 transition font-medium">
            Enviar Resposta como {respondAsUser ? getProfileName(respondAsUser) : '...'}
          </button>
        </div>

        {/* ===== RESPOSTAS ENVIADAS ===== */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">💬 Respostas Enviadas</h2>

          <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
            <option value="">Selecione uma sessão para ver respostas</option>
            {sessions.map((s: any) => (
              <option key={s.id} value={s.id}>{s.id.slice(0, 8)}... ({getProfileName(s.user1_id)} ↔ {getProfileName(s.user2_id)})</option>
            ))}
          </select>

          {selectedSession && respostas.length === 0 && (
            <p className="text-gray-500 text-sm">Nenhuma resposta enviada nesta sessão.</p>
          )}

          {respostas.map((r: any) => (
            <div key={r.id} className="bg-slate-800 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                    Etapa {r.etapa}
                  </span>
                  <span className="text-gray-500 text-xs">{getEtapaTitulo(r.etapa)}</span>
                  <span className="text-gray-600 text-xs">•</span>
                  <span className="text-gray-400 text-xs font-medium">{getProfileName(r.user_id)}</span>
                </div>
                <p className="text-gray-300 text-sm">&ldquo;{r.resposta}&rdquo;</p>
                {r.opcoes_selecionadas && r.opcoes_selecionadas.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {r.opcoes_selecionadas.map((o: string) => (
                      <span key={o} className="px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded-full text-xs">{o}</span>
                    ))}
                  </div>
                )}
                <p className="text-gray-600 text-xs mt-2">{new Date(r.criado_em).toLocaleString('pt-BR')}</p>
              </div>
              <button
                onClick={() => handleDeleteResposta(r.id)}
                className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition flex-shrink-0"
              >
                🗑️ Excluir
              </button>
            </div>
          ))}
        </div>

        {/* ===== CONTEXTO PARA IA ===== */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">🧠 Contexto para IA</h2>
          <p className="text-gray-400 text-sm">
            Adicione informações sobre os participantes que a IA usará para enriquecer as análises.
            Ex: &quot;Felipe gosta de filosofia estoica&quot;, &quot;Samira valoriza conexões profundas&quot;
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white">
              <option value="">Selecione a sessão</option>
              {sessions.map((s: any) => (
                <option key={s.id} value={s.id}>{s.id.slice(0, 8)}...</option>
              ))}
            </select>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white">
              <option value="">Geral (ambos)</option>
              {profiles.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nome} ({p.email})</option>
              ))}
            </select>
          </div>

          <textarea
            value={contexto} onChange={(e) => setContexto(e.target.value)}
            placeholder="Escreva o contexto que a IA deve considerar..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 resize-none"
            rows={3}
          />

          <button onClick={handleAddContext}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition font-medium">
            Adicionar Contexto
          </button>

          {contextos.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-400">Contextos existentes:</h3>
              {contextos.map((c: any) => (
                <div key={c.id} className="bg-slate-700/50 rounded-lg p-3 text-gray-300 text-sm flex items-start justify-between gap-2">
                  <div>
                    <span className="text-purple-400 text-xs font-medium">
                      {c.user_id ? getProfileName(c.user_id) : 'Geral'}:
                    </span>
                    <span className="ml-2">{c.contexto}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
