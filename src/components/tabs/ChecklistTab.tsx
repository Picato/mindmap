'use client'

import { ListChecks } from 'lucide-react'
import type { Project } from '@/types/database'

interface ChecklistTabProps {
  project: Project | null
}

export default function ChecklistTab({ project }: ChecklistTabProps) {
  if (!project) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
        Select or create a project to get started
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          <ListChecks className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
        </div>

        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mb-3">
          Coming Soon
        </span>

        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
          Checklist
        </h3>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          A structured Q&amp;A table to track requirements, criteria, and responses for{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{project.name}</span>.
        </p>

        <ul className="mt-6 text-left space-y-2">
          {[
            'Table-format question and answer rows',
            'Per-row status tracking (pending, done, N/A)',
            'Export to CSV or PDF',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
