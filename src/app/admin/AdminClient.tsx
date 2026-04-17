'use client'

import dynamic from 'next/dynamic'
import { useState, useRef } from 'react'
import {
  Save, Loader2, Trash2, BrainCircuit, Users, LayoutTemplate, ArrowLeft,
  FolderOpen, Plus, X, Check, ChevronDown, ChevronRight, Target, Mail,
} from 'lucide-react'
import Link from 'next/link'
import type { Profile, Template, UserGroup } from '@/types/database'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { DEFAULT_BANTCARE_TEMPLATE } from '@/lib/bantcare'

const CodeMirrorEditor = dynamic(() => import('@/components/editor/CodeMirrorEditor'), { ssr: false })
const MarkmapRenderer = dynamic(() => import('@/components/mindmap/MarkmapRenderer'), { ssr: false })
const BantCarePreviewPanel = dynamic(() => import('@/components/panels/BantCarePreviewPanel'), { ssr: false })

type GroupWithMembers = UserGroup & { group_members: { user_id: string }[] }

const JOB_TITLES = ['VP of Sales', 'Sales', 'Presales', 'DM', 'CDO', 'Chief Architect'] as const

interface AdminClientProps {
  currentUserId: string
  mindmapTemplate: Template | null
  bantcareTemplate: Template | null
  users: Profile[]
  confirmedAt: Record<string, string | null>
  groups: GroupWithMembers[]
}

export default function AdminClient({
  currentUserId, mindmapTemplate, bantcareTemplate,
  users: initialUsers, confirmedAt: initialConfirmedAt, groups: initialGroups,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'mindmap-template' | 'bantcare-template' | 'users' | 'groups'>('mindmap-template')

  // ── Mindmap Template tab ──────────────────────────────────
  const [templateContent, setTemplateContent] = useState(mindmapTemplate?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  async function saveTemplate() {
    setSaving(true)
    const res = await fetch('/api/admin/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: templateContent, type: 'mindmap', updatedBy: currentUserId }),
    })
    setSaving(false)
    if (res.ok) { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500) }
  }

  // ── BANT&CARE Template tab ────────────────────────────────
  const [bcTemplateContent, setBcTemplateContent] = useState(bantcareTemplate?.content ?? DEFAULT_BANTCARE_TEMPLATE)
  const [bcSaving, setBcSaving] = useState(false)
  const [bcSavedFlash, setBcSavedFlash] = useState(false)

  async function saveBantCareTemplate() {
    setBcSaving(true)
    const res = await fetch('/api/admin/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: bcTemplateContent, type: 'bantcare', updatedBy: currentUserId }),
    })
    setBcSaving(false)
    if (res.ok) { setBcSavedFlash(true); setTimeout(() => setBcSavedFlash(false), 1500) }
  }

  // ── Users tab ─────────────────────────────────────────────
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [confirmedAt, setConfirmedAt] = useState<Record<string, string | null>>(initialConfirmedAt)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  // per-user editable fields
  const [nameEdits, setNameEdits] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialUsers.map(u => [u.id, u.full_name ?? '']))
  )
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialUsers.map(u => [u.id, u.job_title ?? '']))
  )
  const [userSaving, setUserSaving] = useState<Record<string, boolean>>({})
  const [userSaved, setUserSaved] = useState<Record<string, boolean>>({})
  const [reInviting, setReInviting] = useState<Record<string, boolean>>({})
  const [reInvited, setReInvited] = useState<Record<string, boolean>>({})

  // add new user form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('')
  const [adding, setAdding] = useState(false)
  const [addResult, setAddResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function addAndInviteUser() {
    if (!newEmail.trim()) return
    setAdding(true)
    setAddResult(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail.trim(), name: newName.trim() || undefined, jobTitle: newRole || undefined }),
    })
    setAdding(false)
    if (res.ok) {
      const data = await res.json()
      if (data.user) {
        const created = data.user as Profile
        setUsers(prev => [created, ...prev])
        setNameEdits(prev => ({ ...prev, [created.id]: created.full_name ?? '' }))
        setRoleEdits(prev => ({ ...prev, [created.id]: created.job_title ?? '' }))
        setConfirmedAt(prev => ({ ...prev, [created.id]: null }))
      }
      setAddResult({ ok: true, msg: `Invitation sent to ${newEmail.trim()}` })
      setNewName(''); setNewEmail(''); setNewRole('')
    } else {
      const data = await res.json()
      setAddResult({ ok: false, msg: data.error ?? 'Failed to send invitation.' })
    }
    setTimeout(() => setAddResult(null), 4000)
  }

  async function saveUser(userId: string) {
    setUserSaving(prev => ({ ...prev, [userId]: true }))
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        fullName: nameEdits[userId]?.trim() || null,
        jobTitle: roleEdits[userId] || null,
      }),
    })
    setUsers(prev => prev.map(u => u.id === userId
      ? { ...u, full_name: nameEdits[userId]?.trim() || null, job_title: roleEdits[userId] || null }
      : u
    ))
    setUserSaving(prev => ({ ...prev, [userId]: false }))
    setUserSaved(prev => ({ ...prev, [userId]: true }))
    setTimeout(() => setUserSaved(prev => ({ ...prev, [userId]: false })), 1500)
  }

  async function sendInvite(userId: string, email: string) {
    setReInviting(prev => ({ ...prev, [userId]: true }))
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setReInviting(prev => ({ ...prev, [userId]: false }))
    setReInvited(prev => ({ ...prev, [userId]: true }))
    setTimeout(() => setReInvited(prev => ({ ...prev, [userId]: false })), 2000)
  }

  async function deleteUser(userId: string) {
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId))
    setDeleteUserId(null)
  }

  const userToDelete = users.find(u => u.id === deleteUserId)

  // ── Groups tab ────────────────────────────────────────────
  const [groups, setGroups] = useState<GroupWithMembers[]>(initialGroups)
  const [newGroupName, setNewGroupName] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [addUserPickerGroupId, setAddUserPickerGroupId] = useState<string | null>(null)

  async function createGroup() {
    if (!newGroupName.trim()) return
    setCreatingGroup(true)
    const res = await fetch('/api/admin/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim() }),
    })
    setCreatingGroup(false)
    if (res.ok) {
      const created = await res.json()
      setGroups(prev => [...prev, { ...created, group_members: [] }])
      setNewGroupName('')
    }
  }

  async function deleteGroup(groupId: string) {
    const res = await fetch('/api/admin/groups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    })
    if (res.ok) {
      setGroups(prev => prev.filter(g => g.id !== groupId))
      if (expandedGroupId === groupId) setExpandedGroupId(null)
    }
    setDeleteGroupId(null)
  }

  async function addMember(groupId: string, userId: string) {
    const res = await fetch('/api/admin/groups/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, userId }),
    })
    if (res.ok) {
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, group_members: [...g.group_members, { user_id: userId }] } : g
      ))
    }
    setAddUserPickerGroupId(null)
  }

  async function removeMember(groupId: string, userId: string) {
    const res = await fetch('/api/admin/groups/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, userId }),
    })
    if (res.ok) {
      setGroups(prev => prev.map(g =>
        g.id === groupId
          ? { ...g, group_members: g.group_members.filter(m => m.user_id !== userId) }
          : g
      ))
    }
  }

  const groupToDelete = groups.find(g => g.id === deleteGroupId)

  // shared styles
  const fieldCls = 'px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-4">
        <BrainCircuit className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        <span className="text-gray-900 dark:text-white font-semibold">Markmap Admin</span>
        <Link
          href="/app"
          className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />Back to App
        </Link>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex gap-1">
        {([
          { key: 'mindmap-template',  label: 'Mindmap Template',        icon: <LayoutTemplate className="w-4 h-4" /> },
          { key: 'bantcare-template', label: 'BANT&CARE Template',       icon: <Target className="w-4 h-4" /> },
          { key: 'users',             label: `Users (${users.length})`,  icon: <Users className="w-4 h-4" /> },
          { key: 'groups',            label: `Teams (${groups.length})`, icon: <FolderOpen className="w-4 h-4" /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-600 dark:text-white'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">

        {/* ── Mindmap Template tab ── */}
        {activeTab === 'mindmap-template' && (
          <div className="flex h-full" style={{ height: 'calc(100vh - 108px)' }}>
            <div className="flex flex-col w-1/2 border-r border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Mindmap Template Editor</span>
                <button onClick={saveTemplate} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savedFlash ? 'Saved!' : 'Save Template'}
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeMirrorEditor value={templateContent} onChange={setTemplateContent} />
              </div>
            </div>
            <div className="flex flex-col w-1/2">
              <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Preview</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <MarkmapRenderer content={templateContent} svgRef={svgRef} />
              </div>
            </div>
          </div>
        )}

        {/* ── BANT&CARE Template tab ── */}
        {activeTab === 'bantcare-template' && (
          <div className="flex h-full" style={{ height: 'calc(100vh - 108px)' }}>
            <div className="flex flex-col w-1/2 border-r border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">BANT&amp;CARE Template Editor</span>
                <button onClick={saveBantCareTemplate} disabled={bcSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                  {bcSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {bcSavedFlash ? 'Saved!' : 'Save Template'}
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeMirrorEditor value={bcTemplateContent} onChange={setBcTemplateContent} />
              </div>
            </div>
            <div className="flex flex-col w-1/2">
              <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Preview</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <BantCarePreviewPanel content={bcTemplateContent} />
              </div>
            </div>
          </div>
        )}

        {/* ── Users tab ── */}
        {activeTab === 'users' && (
          <div className="p-6 overflow-auto" style={{ height: 'calc(100vh - 108px)' }}>

            {/* ── Add new user ── */}
            <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add New User</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Full name"
                    className={`${fieldCls} w-44`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addAndInviteUser() }}
                    placeholder="user@fpt.com"
                    className={`${fieldCls} w-56`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Role</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} className={`${fieldCls} w-44 cursor-pointer`}>
                    <option value="">— Select role —</option>
                    {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button
                  onClick={addAndInviteUser}
                  disabled={adding || !newEmail.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors h-[34px]"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add &amp; Invite
                </button>
              </div>
              {addResult && (
                <p className={`mt-2 text-xs ${addResult.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {addResult.msg}
                </p>
              )}
            </div>

            {/* ── Users table ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Name</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Role</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isConfirmed = !!confirmedAt[user.id]
                    const isSelf = user.id === currentUserId
                    return (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">

                        {/* Name */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                              {(nameEdits[user.id] || user.email || 'U')[0].toUpperCase()}
                            </div>
                            <input
                              type="text"
                              value={nameEdits[user.id] ?? ''}
                              onChange={e => setNameEdits(prev => ({ ...prev, [user.id]: e.target.value }))}
                              placeholder="Enter name…"
                              className={`${fieldCls} w-36`}
                            />
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 text-sm">
                          {user.email}
                        </td>

                        {/* Role dropdown */}
                        <td className="px-4 py-2.5">
                          <select
                            value={roleEdits[user.id] ?? ''}
                            onChange={e => setRoleEdits(prev => ({ ...prev, [user.id]: e.target.value }))}
                            className={`${fieldCls} w-40 cursor-pointer`}
                          >
                            <option value="">— Role —</option>
                            {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>

                        {/* Status: signed-up date or Send Invite button */}
                        <td className="px-4 py-2.5">
                          {isConfirmed ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Signed up {new Date(confirmedAt[user.id]!).toLocaleDateString()}
                            </span>
                          ) : (
                            <button
                              onClick={() => sendInvite(user.id, user.email ?? '')}
                              disabled={reInviting[user.id] || !user.email}
                              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-40 transition-colors"
                            >
                              {reInviting[user.id]
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : reInvited[user.id]
                                ? <Check className="w-3 h-3 text-green-500" />
                                : <Mail className="w-3 h-3" />}
                              {reInvited[user.id] ? 'Sent!' : 'Send Invite'}
                            </button>
                          )}
                        </td>

                        {/* Actions: Save + Delete */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => saveUser(user.id)}
                              disabled={userSaving[user.id]}
                              title="Save changes"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                            >
                              {userSaving[user.id]
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : userSaved[user.id]
                                ? <Check className="w-3 h-3" />
                                : <Save className="w-3 h-3" />}
                              {userSaved[user.id] ? 'Saved' : 'Save'}
                            </button>
                            <button
                              onClick={() => setDeleteUserId(user.id)}
                              disabled={isSelf}
                              title={isSelf ? 'Cannot delete yourself' : 'Remove user'}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">No users yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Groups tab ── */}
        {activeTab === 'groups' && (
          <div className="p-6 overflow-auto" style={{ height: 'calc(100vh - 108px)' }}>
            <div className="mb-6 flex items-center gap-3">
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createGroup() }}
                placeholder="New team name…"
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
              <button
                onClick={createGroup}
                disabled={creatingGroup || !newGroupName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {creatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Team
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {groups.map(group => {
                const memberIds = new Set(group.group_members.map(m => m.user_id))
                const members = users.filter(u => memberIds.has(u.id))
                const nonMembers = users.filter(u => !memberIds.has(u.id))
                const isExpanded = expandedGroupId === group.id
                const isPickerOpen = addUserPickerGroupId === group.id

                return (
                  <div key={group.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                    >
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                      <FolderOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-gray-900 dark:text-white font-medium text-sm">{group.name}</span>
                      <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</span>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteGroupId(group.id) }}
                        title="Delete team"
                        className="ml-auto p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
                        {members.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {members.map(u => (
                              <div key={u.id} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
                                <span>{u.full_name ?? u.email}</span>
                                <button onClick={() => removeMember(group.id, u.id)} title="Remove from group"
                                  className="text-indigo-400 hover:text-red-500 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">No members yet.</p>
                        )}

                        {nonMembers.length > 0 && (
                          <div className="relative">
                            {isPickerOpen ? (
                              <div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 max-h-40 overflow-y-auto">
                                {nonMembers.map(u => (
                                  <button key={u.id} onClick={() => addMember(group.id, u.id)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs text-gray-700 dark:text-gray-300 transition-colors">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs shrink-0">
                                      {(u.full_name ?? u.email ?? 'U')[0].toUpperCase()}
                                    </div>
                                    <span>{u.full_name ?? u.email}</span>
                                    <span className="ml-auto text-gray-400">{u.email}</span>
                                  </button>
                                ))}
                                <button onClick={() => setAddUserPickerGroupId(null)}
                                  className="mt-1 text-xs text-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-1">
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setAddUserPickerGroupId(group.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                <Plus className="w-3.5 h-3.5" />Add member
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {groups.length === 0 && (
                <div className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">No teams yet. Create one above.</div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteUserId}
        title="Remove User"
        message={`Remove ${userToDelete?.full_name ?? userToDelete?.email}? Their account and all projects will be permanently deleted.`}
        confirmLabel="Remove User"
        destructive
        onConfirm={() => deleteUserId && deleteUser(deleteUserId)}
        onCancel={() => setDeleteUserId(null)}
      />
      <ConfirmDialog
        open={!!deleteGroupId}
        title="Delete Team"
        message={`Delete team "${groupToDelete?.name}"? This will not delete the users, only the team.`}
        confirmLabel="Delete Team"
        destructive
        onConfirm={() => deleteGroupId && deleteGroup(deleteGroupId)}
        onCancel={() => setDeleteGroupId(null)}
      />
    </div>
  )
}
