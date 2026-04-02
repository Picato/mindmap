'use client'

import { Network, ListChecks, FolderOpen } from 'lucide-react'

export type AppTab = 'mindmap' | 'checklist' | 'workspace'

const TABS = [
  { key: 'workspace' as const, label: 'Workspace',  Icon: FolderOpen },
  { key: 'mindmap'   as const, label: 'Mindmap',    Icon: Network    },
  { key: 'checklist' as const, label: 'Checklist',  Icon: ListChecks },
]

interface TabBarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex items-center bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-12 shrink-0 px-3 gap-1">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors h-full ${
            activeTab === key
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
