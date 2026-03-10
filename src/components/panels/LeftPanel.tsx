'use client'

import { useState } from 'react'
import {
  Plus, ChevronLeft, ChevronRight, FileText,
  Pencil, Trash2, Check, X, LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Project, Profile } from '@/types/database'
import NewProjectDialog from '@/components/projects/NewProjectDialog'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface LeftPanelProps {
  profile: Profile
  projects: Project[]
  activeProjectId: string | null
  onSelectProject: (project: Project) => void
  onProjectCreated: (project: Project) => void
  onProjectRenamed: (id: string, name: string) => void
  onProjectDeleted: (id: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function LeftPanel({
  profile, projects, activeProjectId,
  onSelectProject, onProjectCreated, onProjectRenamed, onProjectDeleted,
  collapsed, onToggleCollapse,
}: LeftPanelProps) {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function handleCreate(name: string) {
    setShowNewDialog(false)
    const { data: templateData } = await supabase
      .from('templates')
      .select('content')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    const defaultContent = templateData?.content ?? '# My Mindmap\n## Topic 1\n### Subtopic 1\n## Topic 2'
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: profile.id, name, content: defaultContent })
      .select().single()
    if (!error && data) onProjectCreated(data as Project)
  }

  async function commitEdit(id: string) {
    if (!editName.trim()) { setEditingId(null); return }
    const { error } = await supabase.from('projects').update({ name: editName.trim() }).eq('id', id)
    if (!error) onProjectRenamed(id, editName.trim())
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) onProjectDeleted(id)
    setDeleteId(null)
  }

  const projectToDelete = projects.find(p => p.id === deleteId)
  const iconBtn = 'p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors'

  const avatar = profile.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={profile.avatar_url}
      alt={profile.full_name ?? 'User'}
      referrerPolicy="no-referrer"
      className="w-8 h-8 rounded-full shrink-0 object-cover"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
      {(profile.full_name ?? profile.email ?? 'U')[0].toUpperCase()}
    </div>
  )

  return (
    <>
      <aside className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden">

        {collapsed ? (
          /* ── Icon-only strip ── */
          <div className="flex flex-col items-center h-full py-2 gap-1">
            {/* Brand icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/markmap-icon.svg" alt="Markmap" className="w-6 h-6 mb-1" />
            {/* Expand button */}
            <button onClick={onToggleCollapse} title="Expand panel" className={iconBtn}>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* New project */}
            <button onClick={() => setShowNewDialog(true)} title="New project" className={iconBtn}>
              <Plus className="w-4 h-4" />
            </button>

            <div className="w-6 border-t border-gray-200 dark:border-gray-700 my-1" />

            {/* Project icons */}
            <div className="flex-1 flex flex-col items-center gap-0.5 overflow-y-auto w-full px-1">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  title={p.name}
                  className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                    activeProjectId === p.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Bottom icons */}
            <div className="border-t border-gray-200 w-full flex flex-col items-center gap-2 pt-2 pb-1">
              <div title={profile.full_name ?? profile.email ?? ''}>{avatar}</div>
            </div>
          </div>

        ) : (
          /* ── Full panel ── */
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800 h-12 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/markmap-icon.svg" alt="Markmap" className="w-6 h-6 shrink-0" />
                <span className="text-gray-900 dark:text-white font-semibold text-sm truncate">RFP/RFQ/BQ</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => setShowNewDialog(true)} title="New project" className={iconBtn}>
                  <Plus className="w-4 h-4" />
                </button>
                <button onClick={onToggleCollapse} title="Collapse panel" className={iconBtn}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Project list */}
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-2 space-y-0.5">
                {projects.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-500 text-xs px-2 py-4 text-center">No projects yet.</p>
                )}
                {projects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => editingId !== project.id && onSelectProject(project)}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                      activeProjectId === project.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    {editingId === project.id ? (
                      <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitEdit(project.id); if (e.key === 'Escape') setEditingId(null) }}
                          className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-2 py-0.5 rounded outline-none border border-indigo-400 min-w-0"
                        />
                        <button onClick={() => commitEdit(project.id)} className="p-0.5 hover:text-green-600 dark:hover:text-green-400"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="p-0.5 hover:text-red-500 dark:hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm truncate">{project.name}</span>
                        <div className="hidden group-hover:flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditingId(project.id); setEditName(project.name) }}
                            className="p-1 rounded hover:bg-white/20"
                            title="Rename"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteId(project.id)}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-gray-200 p-3 shrink-0 flex items-center gap-2">
              {avatar}
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white text-xs font-medium truncate">{profile.full_name}</p>
                <p className="text-gray-500 text-xs truncate">{profile.email}</p>
              </div>
              <button
                onClick={async () => { await supabase.auth.signOut(); router.push('/auth') }}
                title="Sign out"
                className={iconBtn}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </aside>

      <NewProjectDialog open={showNewDialog} onConfirm={handleCreate} onCancel={() => setShowNewDialog(false)} />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Project"
        message={`Delete "${projectToDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}
