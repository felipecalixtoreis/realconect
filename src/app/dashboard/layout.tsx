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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
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
