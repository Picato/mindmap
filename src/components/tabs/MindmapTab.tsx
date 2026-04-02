'use client'

import MiddlePanel from '@/components/panels/MiddlePanel'
import RightPanel from '@/components/panels/RightPanel'
import PanelDivider from '@/components/panels/PanelDivider'
import type { Project } from '@/types/database'

interface MindmapTabProps {
  project: Project | null
  content: string
  isDirty: boolean
  editorWidth: number
  svgRef: React.RefObject<SVGSVGElement | null>
  onContentChange: (value: string) => void
  onSaved: (value: string) => void
  onExportSVG: () => void
  onExportPNG: () => void
  onProjectUpdated: (updated: Partial<Project>) => void
  onEditorDividerDrag: (delta: number) => void
}

export default function MindmapTab({
  project, content, isDirty, editorWidth, svgRef,
  onContentChange, onSaved, onExportSVG, onExportPNG,
  onProjectUpdated, onEditorDividerDrag,
}: MindmapTabProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <div
        style={{ width: editorWidth, minWidth: editorWidth, maxWidth: editorWidth }}
        className="h-full"
      >
        <MiddlePanel
          project={project}
          content={content}
          isDirty={isDirty}
          onContentChange={onContentChange}
          onSaved={onSaved}
        />
      </div>

      <PanelDivider onDrag={onEditorDividerDrag} />

      <div className="flex-1 h-full overflow-hidden">
        <RightPanel
          project={project}
          content={content}
          svgRef={svgRef}
          onExportSVG={onExportSVG}
          onExportPNG={onExportPNG}
          onProjectUpdated={onProjectUpdated}
        />
      </div>
    </div>
  )
}
