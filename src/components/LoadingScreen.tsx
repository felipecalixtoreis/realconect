'use client'

export function LoadingScreen({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div className="text-center animate-fadeIn">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
        </div>
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  )
}
