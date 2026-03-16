'use client'

import { useEffect, useState } from 'react'

interface TimelineItem {
  data: string
  titulo: string
  descricao?: string
  tipo: 'pergunta' | 'encontro' | 'descoberta'
}

interface TimelineProps {
  items: TimelineItem[]
}

export function Timeline({ items }: TimelineProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'pergunta': return '💬'
      case 'encontro': return '🤝'
      case 'descoberta': return '✨'
      default: return '📌'
    }
  }

  const getColor = (tipo: string) => {
    switch (tipo) {
      case 'pergunta': return 'from-blue-500 to-purple-500'
      case 'encontro': return 'from-pink-500 to-rose-500'
      case 'descoberta': return 'from-purple-500 to-pink-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-pink-500/50 to-transparent" />

      <div className="space-y-8">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative flex items-start gap-4 pl-2 transition-all duration-500"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-20px)',
              transitionDelay: `${index * 200}ms`
            }}
          >
            <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${getColor(item.tipo)} shadow-lg`}>
              <span className="text-lg">{getIcon(item.tipo)}</span>
            </div>

            <div className="flex-1 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <span className="text-xs text-gray-500 font-medium">{item.data}</span>
              <h4 className="text-white font-semibold mt-1">{item.titulo}</h4>
              {item.descricao && (
                <p className="text-gray-400 text-sm mt-2">{item.descricao}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
