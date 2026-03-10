'use client'

import dynamic from 'next/dynamic'
import { useState, useRef } from 'react'
import { Save, Loader2, Trash2, BrainCircuit, Users, LayoutTemplate, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Profile, Template } from '@/types/database'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const CodeMirrorEditor = dynamic(() => import('@/components/editor/CodeMirrorEditor'), { ssr: false })
const MarkmapRenderer = dynamic(() => import('@/components/mindmap/MarkmapRenderer'), { ssr: false })

interface AdminClientProps {
  currentUserId: string
  template: Template | null
  users: Profile[]
}

export default function AdminClient({ currentUserId, template, users: initialUsers }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'template' | 'users'>('template')
  const [templateContent, setTemplateContent] = useState(template?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
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

  const userToDelete = users.find(u => u.id === deleteUserId)

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
        <button
          onClick={() => setActiveTab('template')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'template'
              ? 'border-indigo-500 text-indigo-600 dark:text-white'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          Template
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-600 dark:text-white'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Users ({users.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'template' && (
          <div className="flex h-full" style={{ height: 'calc(100vh - 108px)' }}>
            {/* Editor side */}
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

            {/* Preview side */}
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

        {activeTab === 'users' && (
          <div className="p-6 overflow-auto" style={{ height: 'calc(100vh - 108px)' }}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">User</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Role</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 font-medium px-4 py-3">Signed Up</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
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
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-indigo-100 dark:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
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
    </div>
  )
}
