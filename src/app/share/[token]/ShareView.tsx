'use client'

import dynamic from 'next/dynamic'
import { BrainCircuit } from 'lucide-react'

const MarkmapRenderer = dynamic(() => import('@/components/mindmap/MarkmapRenderer'), { ssr: false })

interface ShareViewProps {
  project: { id: string; name: string; content: string; is_shared: boolean }
}

export default function ShareView({ project }: ShareViewProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <BrainCircuit className="w-5 h-5 text-indigo-400" />
        <span className="text-gray-500 text-sm">Markmap</span>
        <span className="text-gray-700">/</span>
        <span className="text-white font-medium text-sm">{project.name}</span>
      </header>

      {/* Mindmap */}
      <div className="flex-1 overflow-hidden">
        <MarkmapRenderer content={project.content} />
      </div>

      {/* Footer */}
      <footer className="px-6 py-2 bg-gray-900 border-t border-gray-800 shrink-0 flex items-center justify-center">
        <a href="/auth" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
          Made with Markmap
        </a>
      </footer>
    </div>
  )
}
