'use client'

import { useState } from 'react'
import { Copy, Check, Link, Link2Off } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

interface ShareDialogProps {
  open: boolean
  project: Project | null
  onClose: () => void
  onProjectUpdated: (updated: Partial<Project>) => void
}

export default function ShareDialog({ open, project, onClose, onProjectUpdated }: ShareDialogProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  if (!open || !project) return null

  const shareUrl = `${window.location.origin}/share/${project.share_token}`

  async function enableSharing() {
    if (!project) return
    setLoading(true)
    const { error } = await supabase
      .from('projects')
      .update({ is_shared: true })
      .eq('id', project.id)
    if (!error) onProjectUpdated({ is_shared: true })
    setLoading(false)
  }

  async function disableSharing() {
    if (!project) return
    setLoading(true)
    const { error } = await supabase
      .from('projects')
      .update({ is_shared: false })
      .eq('id', project.id)
    if (!error) onProjectUpdated({ is_shared: false })
    setLoading(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Share Mindmap</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {project.is_shared
            ? 'This mindmap is publicly accessible via the link below.'
            : 'Enable sharing to get a public link anyone can view.'}
        </p>

        {project.is_shared ? (
          <>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 mb-4">
              <span className="flex-1 text-indigo-600 dark:text-indigo-400 text-sm truncate">{shareUrl}</span>
              <button
                onClick={copyLink}
                className="shrink-0 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={disableSharing}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <Link2Off className="w-4 h-4" />
                Disable Sharing
              </button>
              <button
                onClick={onClose}
                className="ml-auto px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={enableSharing}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Link className="w-4 h-4" />
              Enable Sharing
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
