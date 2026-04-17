'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, Profile } from '@/types/database'
import LeftPanel from '@/components/panels/LeftPanel'
import PanelDivider from '@/components/panels/PanelDivider'
import TabBar, { type AppTab } from '@/components/tabs/TabBar'
import MindmapTab from '@/components/tabs/MindmapTab'
import ChecklistTab from '@/components/tabs/ChecklistTab'
import WorkspaceTab from '@/components/tabs/WorkspaceTab'
import BantCareTab from '@/components/tabs/BantCareTab'
import { exportSVG, exportPNG } from '@/lib/export'
import { DEFAULT_BANTCARE_TEMPLATE } from '@/lib/bantcare'
import { useRouter } from 'next/navigation'

const MIN_LEFT = 56
const MAX_LEFT = 480
const DEFAULT_LEFT = 280

const MIN_EDITOR = 300
const MAX_EDITOR = 700
const DEFAULT_EDITOR = 420

export default function AppPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [editorWidth, setEditorWidth] = useState(DEFAULT_EDITOR)
  const [activeTab, setActiveTab] = useState<AppTab>('mindmap')
  const [bantCareContent, setBantCareContent] = useState('')
  const [bantCareSavedContent, setBantCareSavedContent] = useState('')
  const [bantCareSaving, setBantCareSaving] = useState(false)
  const [bantCareSavedFlash, setBantCareSavedFlash] = useState(false)
  const [bantCareEditorWidth, setBantCareEditorWidth] = useState(DEFAULT_EDITOR)
  const [bantCareTemplate, setBantCareTemplate] = useState(DEFAULT_BANTCARE_TEMPLATE)
  const [biddingTeamUsers, setBiddingTeamUsers] = useState<{
    vp: { id: string; name: string }[]
    sales: { id: string; name: string }[]
    presales: { id: string; name: string }[]
    dm: { id: string; name: string }[]
  }>({ vp: [], sales: [], presales: [], dm: [] })
  const svgRef = useRef<SVGSVGElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const isDirty = content !== savedContent

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (prof) setProfile(prof as Profile)

      // Fetch admin-configured BANT&CARE template (falls back to default if not set)
      supabase.from('templates').select('content').eq('type', 'bantcare').maybeSingle()
        .then(({ data }) => { if (data?.content) setBantCareTemplate(data.content) })

      // Fetch bidding team users (VP/Sales/Presales roles)
      fetch('/api/users/bidding-team')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setBiddingTeamUsers(data) })

      const { data: projs } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      if (projs) {
        const typedProjs = projs as Project[]
        setProjects(typedProjs)
        if (typedProjs.length > 0) {
          const first = typedProjs[0]
          setActiveProject(first)
          setContent(first.content)
          setSavedContent(first.content)
          const bc = first.bantcare_content ?? ''
          setBantCareContent(bc)
          setBantCareSavedContent(bc)
        }
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  function handleSelectProject(project: Project) {
    if (isDirty) {
      const ok = confirm('You have unsaved changes. Leave without saving?')
      if (!ok) return
    }
    setActiveProject(project)
    setContent(project.content)
    setSavedContent(project.content)
    const bc = project.bantcare_content ?? ''
    setBantCareContent(bc)
    setBantCareSavedContent(bc)
  }

  function handleProjectCreated(project: Project) {
    setProjects(prev => [project, ...prev])
    handleSelectProject(project)
  }

  function handleProjectRenamed(id: string, name: string) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p))
    if (activeProject?.id === id) setActiveProject(prev => prev ? { ...prev, name } : prev)
  }

  function handleProjectDeleted(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
    if (activeProject?.id === id) { setActiveProject(null); setContent(''); setSavedContent('') }
  }

  function handleSaved(savedVal: string) {
    setSavedContent(savedVal)
    setProjects(prev =>
      prev.map(p => p.id === activeProject?.id ? { ...p, content: savedVal, updated_at: new Date().toISOString() } : p)
    )
  }

  async function handleBantCareSave() {
    if (!activeProject) return
    setBantCareSaving(true)
    const { error } = await supabase.from('projects')
      .update({ bantcare_content: bantCareContent, updated_at: new Date().toISOString() })
      .eq('id', activeProject.id)
    setBantCareSaving(false)
    if (!error) {
      setBantCareSavedContent(bantCareContent)
      setBantCareSavedFlash(true)
      setTimeout(() => setBantCareSavedFlash(false), 1500)
    }
  }

  function handleProjectUpdated(updated: Partial<Project>) {
    if (!activeProject) return
    const merged = { ...activeProject, ...updated }
    setActiveProject(merged)
    setProjects(prev => prev.map(p => p.id === merged.id ? merged : p))
  }

  const handleExportSVG = useCallback(() => {
    if (svgRef.current && activeProject) exportSVG(svgRef.current, activeProject.name)
  }, [activeProject])

  const handleExportPNG = useCallback(() => {
    if (svgRef.current && activeProject) exportPNG(svgRef.current, activeProject.name)
  }, [activeProject])

  const handleLeftDividerDrag = useCallback((delta: number) => {
    setLeftWidth(w => Math.min(MAX_LEFT, Math.max(MIN_LEFT, w + delta)))
  }, [])

  const handleEditorDividerDrag = useCallback((delta: number) => {
    setEditorWidth(w => Math.min(MAX_EDITOR, Math.max(MIN_EDITOR, w + delta)))
  }, [])

  const handleBantCareEditorDividerDrag = useCallback((delta: number) => {
    setBantCareEditorWidth(w => Math.min(MAX_EDITOR, Math.max(MIN_EDITOR, w + delta)))
  }, [])

  if (!profile) {
    return (
      <div className="h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      {/* Left panel — icon strip (56px) when collapsed, full width otherwise */}
      <div
        style={{
          width: leftCollapsed ? 56 : leftWidth,
          minWidth: leftCollapsed ? 56 : leftWidth,
          maxWidth: leftCollapsed ? 56 : leftWidth,
        }}
        className="h-full overflow-hidden"
      >
        <LeftPanel
          profile={profile}
          projects={projects}
          activeProjectId={activeProject?.id ?? null}
          onSelectProject={handleSelectProject}
          onProjectCreated={handleProjectCreated}
          onProjectRenamed={handleProjectRenamed}
          onProjectDeleted={handleProjectDeleted}
          collapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed(c => !c)}
        />
      </div>

      {/* Divider only when panel is expanded (icon strip is fixed, not resizable) */}
      {!leftCollapsed && <PanelDivider onDrag={handleLeftDividerDrag} />}

      {/* Right section: TabBar + tab content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-hidden">
          {activeTab === 'mindmap' && (
            <MindmapTab
              project={activeProject}
              content={content}
              isDirty={isDirty}
              editorWidth={editorWidth}
              svgRef={svgRef}
              onContentChange={setContent}
              onSaved={handleSaved}
              onExportSVG={handleExportSVG}
              onExportPNG={handleExportPNG}
              onProjectUpdated={handleProjectUpdated}
              onEditorDividerDrag={handleEditorDividerDrag}
            />
          )}
          {activeTab === 'checklist' && <ChecklistTab project={activeProject} />}
          {activeTab === 'workspace' && <WorkspaceTab project={activeProject} />}
          {activeTab === 'bantcare' && (
            <BantCareTab
              content={bantCareContent}
              editorWidth={bantCareEditorWidth}
              template={bantCareTemplate}
              saving={bantCareSaving}
              savedFlash={bantCareSavedFlash}
              isDirty={bantCareContent !== bantCareSavedContent}
              hasProject={!!activeProject}
              vpUsers={biddingTeamUsers.vp}
              salesUsers={biddingTeamUsers.sales}
              presalesUsers={biddingTeamUsers.presales}
              dmUsers={biddingTeamUsers.dm}
              onContentChange={setBantCareContent}
              onSave={handleBantCareSave}
              onEditorDividerDrag={handleBantCareEditorDividerDrag}
            />
          )}
        </div>
      </div>
    </div>
  )
}
