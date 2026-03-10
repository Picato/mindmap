'use client'

import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { BrainCircuit, Download } from 'lucide-react'
import { exportSVG, exportPNG } from '@/lib/export'

const MarkmapRenderer = dynamic(() => import('@/components/mindmap/MarkmapRenderer'), { ssr: false })

interface ShareViewProps {
  project: { id: string; name: string; content: string; is_shared: boolean }
}

export default function ShareView({ project }: ShareViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

<<<<<<< HEAD
  // Force light theme on the share page
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark')
    return () => {
      const saved = localStorage.getItem('markmap-theme')
      if (saved !== 'light') html.classList.add('dark')
    }
  }, [])

=======
>>>>>>> darktheme
  const handleExportSVG = () => {
    if (svgRef.current) exportSVG(svgRef.current, project.name)
    setShowExportMenu(false)
  }

  const handleExportPNG = async () => {
    if (svgRef.current) await exportPNG(svgRef.current, project.name, '#ffffff')
    setShowExportMenu(false)
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <BrainCircuit className="w-5 h-5 text-indigo-600" />
        <span className="text-gray-400 text-sm">Markmap</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium text-sm">{project.name}</span>

        {/* Export dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowExportMenu(e => !e)}
            title="Export mindmap"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden min-w-[120px]">
                <button
                  onClick={handleExportSVG}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Export SVG
                </button>
                <button
                  onClick={handleExportPNG}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Export PNG
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mindmap */}
      <div className="flex-1 overflow-hidden">
        <MarkmapRenderer content={project.content} svgRef={svgRef} />
      </div>

      {/* Footer */}
      <footer className="px-6 py-2 bg-white border-t border-gray-200 shrink-0 flex items-center justify-center">
        <a href="/auth" className="text-gray-400 hover:text-gray-600 text-xs transition-colors">
          Made with Markmap
        </a>
      </footer>
    </div>
  )
}
