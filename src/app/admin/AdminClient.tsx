'use client'

import dynamic from 'next/dynamic'
import { useState, useRef } from 'react'
import {
  Save, Loader2, Trash2, BrainCircuit, Users, LayoutTemplate, ArrowLeft,
  FolderOpen, Plus, X, Check, ChevronDown, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import type { Profile, Template, UserGroup } from '@/types/database'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const CodeMirrorEditor = dynamic(() => import('@/components/editor/CodeMirrorEditor'), { ssr: false })
const MarkmapRenderer = dynamic(() => import('@/components/mindmap/MarkmapRenderer'), { ssr: false })

type GroupWithMembers = UserGroup & { group_members: { user_id: string }[] }

interface AdminClientProps {
  currentUserId: string
  template: Template | null
  users: Profile[]
  groups: GroupWithMembers[]
}

export default function AdminClient({ currentUserId, template, users: initialUsers, groups: initialGroups }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'template' | 'users' | 'groups'>('template')

  // ── Template tab ──────────────────────────────────────────
  const [templateContent, setTemplateContent] = useState(template?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  async function saveTemplate() {
    setSaving(true)
    const res = await fetch('/api/admin/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: templateContent, updatedBy: currentUserId }),
    })
    setSaving(false)
    if (res.ok) {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
    }
  }

  // ── Users tab ─────────────────────────────────────────────
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  // alias: track unsaved edits per user
  const [aliasEdits, setAliasEdits] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialUsers.map(u => [u.id, u.alias ?? '']))
  )
  const [aliasSaving, setAliasSaving] = useState<Record<string, boolean>>({})
  const [aliasSaved, setAliasSaved] = useState<Record<string, boolean>>({})
  // invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function inviteUser() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteResult(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    })
    setInviting(false)
    if (res.ok) {
      setInviteResult({ ok: true, msg: `Invitation sent to ${inviteEmail.trim()}` })
      setInviteEmail('')
    } else {
      const data = await res.json()
      setInviteResult({ ok: false, msg: data.error ?? 'Failed to send invitation.' })
    }
    setTimeout(() => setInviteResult(null), 4000)
  }

  async function deleteUser(userId: string) {
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId))
    }
    setDeleteUserId(null)
  }

  async function saveAlias(userId: string) {
    setAliasSaving(prev => ({ ...prev, [userId]: true }))
    const alias = aliasEdits[userId]?.trim() || null
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, alias }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, alias } : u))
    setAliasSaving(prev => ({ ...prev, [userId]: false }))
    setAliasSaved(prev => ({ ...prev, [userId]: true }))
    setTimeout(() => setAliasSaved(prev => ({ ...prev, [userId]: false })), 1500)
  }

  const userToDelete = users.find(u => u.id === deleteUserId)

  // ── Groups tab ────────────────────────────────────────────
  const [groups, setGroups] = useState<GroupWithMembers[]>(initialGroups)
  const [newGroupName, setNewGroupName] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  // per-group user picker state
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
        g.id === groupId
          ? { ...g, group_members: [...g.group_members, { user_id: userId }] }
          : g
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
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex gap-1">
        {([
          { key: 'template', label: 'Template', icon: <LayoutTemplate className="w-4 h-4" /> },
          { key: 'users', label: `Users (${users.length})`, icon: <Users className="w-4 h-4" /> },
          { key: 'groups', label: `Teams (${groups.length})`, icon: <FolderOpen className="w-4 h-4" /> },
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
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">

        {/* ── Template tab ── */}
        {activeTab === 'template' && (
          <div className="flex h-full" style={{ height: 'calc(100vh - 108px)' }}>
            <div className="flex flex-col w-1/2 border-r border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Template Editor</span>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
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

        {/* ── Users tab ── */}
        {activeTab === 'users' && (
          <div className="p-6 overflow-auto" style={{ height: 'calc(100vh - 108px)' }}>
            {/* Invite user */}
            <div className="mb-5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') inviteUser() }}
                  placeholder="Invite by email (user@fpt.com)"
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-72"
                />
                <button
                  onClick={inviteUser}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Send Invite
                </button>
              </div>
              {inviteResult && (
                <p className={`text-xs px-1 ${inviteResult.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {inviteResult.msg}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">User</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Alias</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Role</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Signed Up</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      {/* Avatar + name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                              {(user.full_name ?? user.email ?? 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-gray-900 dark:text-white">{user.full_name ?? '—'}</span>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                      {/* Alias */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={aliasEdits[user.id] ?? ''}
                            onChange={e => setAliasEdits(prev => ({ ...prev, [user.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') saveAlias(user.id) }}
                            placeholder="Add alias…"
                            className="w-32 px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => saveAlias(user.id)}
                            disabled={aliasSaving[user.id]}
                            title="Save alias"
                            className="p-1 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors disabled:opacity-40"
                          >
                            {aliasSaving[user.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : aliasSaved[user.id] ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-indigo-100 dark:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      {/* Signed up */}
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      {/* Delete */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteUserId(user.id)}
                          disabled={user.id === currentUserId}
                          title={user.id === currentUserId ? 'Cannot delete yourself' : 'Remove user'}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
            {/* Create group */}
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

            {/* Group list */}
            <div className="flex flex-col gap-3">
              {groups.map(group => {
                const memberIds = new Set(group.group_members.map(m => m.user_id))
                const members = users.filter(u => memberIds.has(u.id))
                const nonMembers = users.filter(u => !memberIds.has(u.id))
                const isExpanded = expandedGroupId === group.id
                const isPickerOpen = addUserPickerGroupId === group.id

                return (
                  <div key={group.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                    {/* Group header */}
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}>
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

                    {/* Expanded: member list + add member */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
                        {/* Current members */}
                        {members.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {members.map(u => (
                              <div key={u.id} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
                                <span>{u.alias ?? u.full_name ?? u.email}</span>
                                <button
                                  onClick={() => removeMember(group.id, u.id)}
                                  title="Remove from group"
                                  className="text-indigo-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">No members yet.</p>
                        )}

                        {/* Add member */}
                        {nonMembers.length > 0 && (
                          <div className="relative">
                            {isPickerOpen ? (
                              <div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 max-h-40 overflow-y-auto">
                                {nonMembers.map(u => (
                                  <button
                                    key={u.id}
                                    onClick={() => addMember(group.id, u.id)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs text-gray-700 dark:text-gray-300 transition-colors"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs shrink-0">
                                      {(u.full_name ?? u.email ?? 'U')[0].toUpperCase()}
                                    </div>
                                    <span>{u.alias ?? u.full_name ?? u.email}</span>
                                    <span className="ml-auto text-gray-400">{u.email}</span>
                                  </button>
                                ))}
                                <button
                                  onClick={() => setAddUserPickerGroupId(null)}
                                  className="mt-1 text-xs text-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddUserPickerGroupId(group.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add member
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

      {/* Delete user dialog */}
      <ConfirmDialog
        open={!!deleteUserId}
        title="Remove User"
        message={`Remove ${userToDelete?.full_name ?? userToDelete?.email}? Their account and all projects will be permanently deleted.`}
        confirmLabel="Remove User"
        destructive
        onConfirm={() => deleteUserId && deleteUser(deleteUserId)}
        onCancel={() => setDeleteUserId(null)}
      />

      {/* Delete group dialog */}
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
