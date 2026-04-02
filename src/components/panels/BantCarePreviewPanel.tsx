'use client'

import { useMemo, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { generateBantCareHTML } from '@/lib/bantcare'

interface BantCarePreviewPanelProps {
  content: string
}

export default function BantCarePreviewPanel({ content }: BantCarePreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const html = useMemo(() => generateBantCareHTML(content), [content])

  return (
    <div className="relative h-full overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
          Start typing markdown on the left to see the preview
        </div>
      )}

      {/* Fullscreen button — fixed bottom-right, always visible even when scrolling */}
      {html && !isFullscreen && (
        <button
          onClick={() => setIsFullscreen(true)}
          title="View fullscreen"
          className="fixed bottom-4 right-4 z-20 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-gray-100 overflow-auto p-4">
          <div dangerouslySetInnerHTML={{ __html: html }} />
          <button
            onClick={() => setIsFullscreen(false)}
            title="Close fullscreen"
            className="fixed top-4 right-4 p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 shadow-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
