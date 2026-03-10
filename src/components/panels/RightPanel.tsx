'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Download, Link } from 'lucide-react'
import type { Project } from '@/types/database'
import ShareDialog from '@/components/share/ShareDialog'

const MarkmapRenderer = dynamic(() => import('@/components/mindmap/MarkmapRenderer'), { ssr: false })

interface RightPanelProps {
  project: Project | null
  content: string
  svgRef: React.RefObject<SVGSVGElement | null>
  onExportSVG: () => void
  onExportPNG: () => void
  onProjectUpdated: (updated: Partial<Project>) => void
}

export default function RightPanel({ project, content, svgRef, onExportSVG, onExportPNG, onProjectUpdated }: RightPanelProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)

  const overlayBtn = 'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 shadow-sm'

  if (!project) {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
        Your mindmap will appear here
      </div>
    )
  }

  return (
    <div className="relative flex-1 h-full overflow-hidden">
      <MarkmapRenderer content={content} svgRef={svgRef} />

      {/* Top-right overlay toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(e => !e)}
            title="Export mindmap"
            className={overlayBtn}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[120px]">
                <button
                  onClick={() => { onExportSVG(); setShowExportMenu(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Export SVG
                </button>
                <button
                  onClick={() => { onExportPNG(); setShowExportMenu(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Export PNG
                </button>
              </div>
            </>
          )}
        </div>

        {/* Share button */}
        <button
          onClick={() => setShowShareDialog(true)}
          title="Share mindmap"
          className={overlayBtn}
        >
          <Link className="w-3.5 h-3.5" />
          {project.is_shared ? 'Shared ✓' : 'Share'}
        </button>
      </div>

      <ShareDialog
        open={showShareDialog}
        project={project}
        onClose={() => setShowShareDialog(false)}
        onProjectUpdated={onProjectUpdated}
      />
    </div>
  )
}
