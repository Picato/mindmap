'use client'

import { useRef, useCallback } from 'react'

interface PanelDividerProps {
  onDrag: (delta: number) => void
}

export default function PanelDivider({ onDrag }: PanelDividerProps) {
  const dividerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastX = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    lastX.current = e.clientX
    dividerRef.current?.classList.add('dragging')
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current) return
      const delta = e.clientX - lastX.current
      lastX.current = e.clientX
      onDrag(delta)
    }

    function handleMouseUp() {
      isDragging.current = false
      dividerRef.current?.classList.remove('dragging')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [onDrag])

  return (
    <div
      ref={dividerRef}
      onMouseDown={handleMouseDown}
      className="panel-divider bg-gray-200 dark:bg-gray-800"
    />
  )
}
