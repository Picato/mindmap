'use client'

import dynamic from 'next/dynamic'
import { Save, LayoutTemplate, Loader2 } from 'lucide-react'

const CodeMirrorEditor = dynamic(
  () => import('@/components/editor/CodeMirrorEditor'),
  { ssr: false }
)

interface BantCareEditorPanelProps {
  content: string
  template: string
  saving: boolean
  savedFlash: boolean
  isDirty: boolean
  hasProject: boolean
  onContentChange: (value: string) => void
  onSave: () => void
}

export default function BantCareEditorPanel({
  content, template, saving, savedFlash, isDirty, hasProject,
  onContentChange, onSave,
}: BantCareEditorPanelProps) {
  function handleLoadTemplate() {
    if (content.trim() && !confirm('Load default template? This will replace your current content.')) return
    onContentChange(template)
  }

  const toolbarBtn = 'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40 shrink-0'

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800 h-12 shrink-0 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">BANT&amp;CARE</span>

        <button
          onClick={handleLoadTemplate}
          title="Load template"
          className={`${toolbarBtn} text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />Template
        </button>

        <button
          onClick={onSave}
          disabled={!hasProject || saving}
          title="Save (⌘S)"
          className={`${toolbarBtn} font-medium bg-indigo-600 hover:bg-indigo-700 text-white relative`}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {savedFlash ? 'Saved!' : 'Save'}
          {isDirty && !saving && !savedFlash && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
          )}
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <CodeMirrorEditor value={content} onChange={onContentChange} onSave={onSave} />
      </div>
    </div>
  )
}
