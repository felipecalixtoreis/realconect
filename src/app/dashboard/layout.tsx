import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Nav bar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/20 border border-indigo-400/20">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                {/* Left wing */}
                <path d="M8 12c-3-1.5-5.5-0.5-6 2s1 3.5 3 3" stroke="rgba(200,180,255,0.6)" strokeWidth="1.2" fill="rgba(200,180,255,0.1)" strokeLinecap="round" />
                <path d="M9 10c-2.5-2-5-1.5-5.5 0.5s0.5 3 2.5 2.5" stroke="rgba(200,180,255,0.4)" strokeWidth="0.9" fill="rgba(200,180,255,0.06)" strokeLinecap="round" />
                {/* Right wing */}
                <path d="M24 12c3-1.5 5.5-0.5 6 2s-1 3.5-3 3" stroke="rgba(200,180,255,0.6)" strokeWidth="1.2" fill="rgba(200,180,255,0.1)" strokeLinecap="round" />
                <path d="M23 10c2.5-2 5-1.5 5.5 0.5s-0.5 3-2.5 2.5" stroke="rgba(200,180,255,0.4)" strokeWidth="0.9" fill="rgba(200,180,255,0.06)" strokeLinecap="round" />
                {/* Body glow */}
                <ellipse cx="16" cy="15" rx="5" ry="7" fill="rgba(139,92,246,0.1)" />
                {/* Head */}
                <circle cx="16" cy="8.5" r="4" fill="rgba(200,180,255,0.9)" />
                {/* Eyes */}
                <circle cx="14.5" cy="8" r="0.6" fill="rgba(255,255,255,0.95)" />
                <circle cx="17.5" cy="8" r="0.6" fill="rgba(255,255,255,0.95)" />
                {/* Body */}
                <path d="M16 13c-3.5 0-6 2.5-6.5 6h13c-.5-3.5-3-6-6.5-6z" fill="rgba(200,180,255,0.7)" />
                {/* Robe detail */}
                <path d="M13 16c0 0 1.5 2 3 2s3-2 3-2" stroke="rgba(139,92,246,0.4)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
                {/* Bow */}
                <path d="M22 6c2-1.5 3.5-0.5 3.5 1.5s-2 2.5-3.5 1.5" stroke="rgba(255,180,200,0.95)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                <line x1="22" y1="7.5" x2="26.5" y2="4.5" stroke="rgba(255,180,200,0.95)" strokeWidth="0.9" strokeLinecap="round" />
                {/* Arrow tip */}
                <path d="M26.5 4.5l1 0.5-0.5 1" stroke="rgba(255,180,200,0.95)" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Crown/laurel */}
                <path d="M13 5.5c0.5-1 1.5-1.5 3-1.5s2.5 0.5 3 1.5" stroke="rgba(255,215,0,0.5)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-white font-semibold">A vida é curta. Está pronta?</span>
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Sair
            </button>
          </form>
        </div>
      </nav>

      <main className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
