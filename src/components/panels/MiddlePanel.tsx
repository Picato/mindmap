'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { Save, LayoutTemplate, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const CodeMirrorEditor = dynamic(() => import('@/components/editor/CodeMirrorEditor'), { ssr: false })

interface MiddlePanelProps {
  project: Project | null
  content: string
  isDirty: boolean
  onContentChange: (value: string) => void
  onSaved: (content: string) => void
}

export default function MiddlePanel({
  project, content, isDirty,
  onContentChange, onSaved,
}: MiddlePanelProps) {
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, content])

  async function handleSave() {
    if (!project) return
    setSaving(true)
    const { error } = await supabase.from('projects')
      .update({ content, updated_at: new Date().toISOString() }).eq('id', project.id)
    setSaving(false)
    if (!error) { onSaved(content); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500) }
  }

  async function applyTemplate() {
    setShowTemplateConfirm(false)
    const { data } = await supabase.from('templates').select('content').limit(1).single()
    if (data) onContentChange((data as { content: string }).content)
  }

  const toolbarBtn = 'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40 shrink-0'

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800 h-12 shrink-0 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
        <span className="text-gray-700 dark:text-gray-300 text-sm font-medium truncate flex-1 min-w-0">
          {project ? project.name : 'No project selected'}
        </span>

        <button onClick={() => setShowTemplateConfirm(true)} disabled={!project} title="Apply template"
          className={`${toolbarBtn} text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`}>
          <LayoutTemplate className="w-3.5 h-3.5" />Template
        </button>

        <button onClick={handleSave} disabled={!project || saving} title="Save (⌘S)"
          className={`${toolbarBtn} font-medium bg-indigo-600 hover:bg-indigo-700 text-white relative`}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {savedFlash ? 'Saved!' : 'Save'}
          {isDirty && !saving && !savedFlash && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {project ? (
          <CodeMirrorEditor value={content} onChange={onContentChange} onSave={handleSave} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
            Select or create a project to get started
          </div>
        )}
      </div>

      <ConfirmDialog open={showTemplateConfirm} title="Apply Template"
        message="This will replace the current editor content with the saved template. This action cannot be undone. Continue?"
        confirmLabel="Apply Template"
        onConfirm={applyTemplate} onCancel={() => setShowTemplateConfirm(false)} />
    </div>
  )
}
