'use client'

import { useEffect, useRef } from 'react'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'
import { Maximize2 } from 'lucide-react'

const transformer = new Transformer()

interface MarkmapRendererProps {
  content: string
  svgRef?: React.RefObject<SVGSVGElement | null>
}

export default function MarkmapRenderer({ content, svgRef: externalSvgRef }: MarkmapRendererProps) {
  const internalSvgRef = useRef<SVGSVGElement>(null)
  const svgRef = externalSvgRef ?? internalSvgRef
  const markmapRef = useRef<Markmap | null>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const { root } = transformer.transform(content || '# Empty')
    const mm = Markmap.create(svgRef.current, {}, root)
    markmapRef.current = mm
    return () => { mm.destroy(); markmapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!markmapRef.current) return
    const { root } = transformer.transform(content || '# Empty')
    markmapRef.current.setData(root)
    markmapRef.current.fit()
  }, [content])

  return (
    <div className="relative w-full h-full bg-gray-50 dark:bg-gray-950">
      <svg ref={svgRef as React.RefObject<SVGSVGElement>} className="w-full h-full" />
      <button
        onClick={() => markmapRef.current?.fit()}
        title="Fit to screen"
        className="absolute bottom-4 right-4 p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  )
}
