'use client'

import { FolderOpen, Upload, MessageSquare } from 'lucide-react'
import type { Project } from '@/types/database'

interface WorkspaceTabProps {
  project: Project | null
}

export default function WorkspaceTab({ project }: WorkspaceTabProps) {
  if (!project) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
        Select or create a project to get started
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          <FolderOpen className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
        </div>

        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mb-3">
          Coming Soon
        </span>

        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
          Workspace
        </h3>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
          Upload documents and chat with an AI assistant to extract insights for{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{project.name}</span>.
        </p>

        <div className="flex gap-3 text-left">
          <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Documents</span>
            </div>
            <div className="space-y-2">
              {[
                'Upload PDF, DOCX, or TXT files',
                'Manage source documents',
                'Version history',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">AI Chat</span>
            </div>
            <div className="space-y-2">
              {[
                'Ask questions about your docs',
                'Generate mindmap content',
                'Summarize key points',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
