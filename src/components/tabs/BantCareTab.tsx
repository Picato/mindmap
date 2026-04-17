'use client'

import BantCareEditorPanel from '@/components/panels/BantCareEditorPanel'
import BantCarePreviewPanel from '@/components/panels/BantCarePreviewPanel'
import PanelDivider from '@/components/panels/PanelDivider'

interface ProfileOption { id: string; name: string }

interface BantCareTabProps {
  content: string
  editorWidth: number
  template: string
  saving: boolean
  savedFlash: boolean
  isDirty: boolean
  hasProject: boolean
  vpUsers?: ProfileOption[]
  salesUsers?: ProfileOption[]
  presalesUsers?: ProfileOption[]
  dmUsers?: ProfileOption[]
  onContentChange: (value: string) => void
  onSave: () => void
  onEditorDividerDrag: (delta: number) => void
}

export default function BantCareTab({
  content,
  editorWidth,
  template,
  saving,
  savedFlash,
  isDirty,
  hasProject,
  vpUsers = [],
  salesUsers = [],
  presalesUsers = [],
  dmUsers = [],
  onContentChange,
  onSave,
  onEditorDividerDrag,
}: BantCareTabProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <div
        style={{ width: editorWidth, minWidth: editorWidth, maxWidth: editorWidth }}
        className="h-full"
      >
        <BantCareEditorPanel
          content={content}
          template={template}
          saving={saving}
          savedFlash={savedFlash}
          isDirty={isDirty}
          hasProject={hasProject}
          vpUsers={vpUsers}
          salesUsers={salesUsers}
          presalesUsers={presalesUsers}
          dmUsers={dmUsers}
          onContentChange={onContentChange}
          onSave={onSave}
        />
      </div>

      <PanelDivider onDrag={onEditorDividerDrag} />

      <div className="flex-1 h-full overflow-hidden">
        <BantCarePreviewPanel content={content} />
      </div>
    </div>
  )
}
