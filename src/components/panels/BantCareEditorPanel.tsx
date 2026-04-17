'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, LayoutTemplate, Loader2 } from 'lucide-react'
import {
  type BantCareMetadata,
  type BantCareSections,
  EMPTY_METADATA,
  EMPTY_SECTIONS,
  extractMetadataAndSections,
  metadataToMarkdown,
  sectionsToMarkdown,
} from '@/lib/bantcare'

interface ProfileOption { id: string; name: string }

interface BantCareEditorPanelProps {
  content: string
  template: string
  saving: boolean
  savedFlash: boolean
  isDirty: boolean
  hasProject: boolean
  vpUsers?: ProfileOption[]
  salesUsers?: ProfileOption[]
  presalesUsers?: ProfileOption[]
  dmUsers?: ProfileOption[]
  onContentChange: (value: string) => void
  onSave: () => void
}

const SALES_MODELS = ['Fixed Price', 'T&M', 'Panel', 'Other']

const SECTION_FIELDS: { key: keyof BantCareSections; label: string; placeholder: string; rows: number }[] = [
  { key: 'budget',     label: 'Budget',                          placeholder: 'Budget details, constraints…', rows: 4 },
  { key: 'authority',  label: 'Authority',                       placeholder: 'Decision makers, influencers (markdown table supported)…', rows: 5 },
  { key: 'need',       label: 'Need',                            placeholder: 'Client pain points and requirements…', rows: 4 },
  { key: 'timeline',   label: 'Timeline',                        placeholder: 'Project timeline, submission date…', rows: 4 },
  { key: 'competitors', label: 'Competitors',                    placeholder: '1. Competitor – insight\n2. Competitor – insight', rows: 4 },
  { key: 'advantages', label: 'Advantages & Value Proposition',  placeholder: 'FPT advantages vs competitors…', rows: 4 },
  { key: 'risk',       label: 'Risk / Challenges / Not Clear',   placeholder: '- Risk: …\n- Challenges: …\n- Not Clear: …', rows: 4 },
  { key: 'expertise',  label: 'Expertise',                       placeholder: "FPT's relevant expertise and certifications…", rows: 4 },
]

function serialize(meta: BantCareMetadata, sections: BantCareSections): string {
  return metadataToMarkdown(meta) + '\n\n' + sectionsToMarkdown(sections)
}

function AutoTextarea({
  value, onChange, placeholder, rows, className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function resize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => { resize() }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={rows ?? 4}
      onChange={e => { onChange(e.target.value); resize() }}
      className={className}
      style={{ resize: 'vertical', minHeight: `${(rows ?? 4) * 1.5}rem` }}
    />
  )
}

export default function BantCareEditorPanel({
  content, template, saving, savedFlash, isDirty, hasProject,
  vpUsers = [], salesUsers = [], presalesUsers = [], dmUsers = [],
  onContentChange, onSave,
}: BantCareEditorPanelProps) {
  const [meta, setMeta] = useState<BantCareMetadata>(EMPTY_METADATA)
  const [sections, setSections] = useState<BantCareSections>(EMPTY_SECTIONS)
  const isInternalChange = useRef(false)

  useEffect(() => {
    if (isInternalChange.current) { isInternalChange.current = false; return }
    const parsed = extractMetadataAndSections(content)
    setMeta(parsed.metadata)
    setSections(parsed.sections)
  }, [content])

  const emitChange = useCallback((newMeta: BantCareMetadata, newSections: BantCareSections) => {
    isInternalChange.current = true
    onContentChange(serialize(newMeta, newSections))
  }, [onContentChange])

  function setField<K extends keyof BantCareMetadata>(key: K, value: BantCareMetadata[K]) {
    const newMeta = { ...meta, [key]: value }
    setMeta(newMeta)
    emitChange(newMeta, sections)
  }

  function setSectionField(key: keyof BantCareSections, value: string) {
    const newSections = { ...sections, [key]: value }
    setSections(newSections)
    emitChange(meta, newSections)
  }

  function handleLoadTemplate() {
    if (content.trim() && !confirm('Load default template? This will replace your current content.')) return
    const parsed = extractMetadataAndSections(template)
    setMeta(parsed.metadata)
    setSections(parsed.sections)
    isInternalChange.current = true
    onContentChange(template)
  }

  const toolbarBtn = 'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40 shrink-0'
  const lbl = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
  const inputCls = 'w-full px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500'
  const selectCls = `${inputCls} cursor-pointer`
  const textareaCls = `${inputCls} font-mono leading-relaxed`

  function UserSelect({ value, onChange, options, placeholder }: {
    value: string; onChange: (v: string) => void; options: ProfileOption[]; placeholder: string
  }) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className={selectCls}>
        <option value="">— {placeholder} —</option>
        {options.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
      </select>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800 h-12 shrink-0 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">BANT&amp;CARE</span>
        <button onClick={handleLoadTemplate} title="Load template"
          className={`${toolbarBtn} text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`}>
          <LayoutTemplate className="w-3.5 h-3.5" />Template
        </button>
        <button onClick={onSave} disabled={!hasProject || saving} title="Save (⌘S)"
          className={`${toolbarBtn} font-medium bg-indigo-600 hover:bg-indigo-700 text-white relative`}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {savedFlash ? 'Saved!' : 'Save'}
          {isDirty && !saving && !savedFlash && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Deal Info ─────────────────────────────────── */}
        <div className="px-3 py-3 flex flex-col gap-3">

          <div>
            <label className={lbl}>Deal Name</label>
            <input type="text" value={meta.dealName} onChange={e => setField('dealName', e.target.value)}
              placeholder="e.g. Project Alpha" className={inputCls} />
          </div>

          <div>
            <label className={lbl}>Client</label>
            <input type="text" value={meta.client} onChange={e => setField('client', e.target.value)}
              placeholder="e.g. Acme Corp" className={inputCls} />
          </div>

          <div>
            <label className={lbl}>Total Contract Value (SGD)</label>
            <input type="number" min="0" value={meta.totalContractValue}
              onChange={e => setField('totalContractValue', e.target.value)}
              placeholder="e.g. 2500000" className={inputCls} />
          </div>

          <div>
            <label className={lbl}>Bidding Team</label>
            <div className="flex flex-col gap-2">
              {([
                { roleLabel: 'VP',       field: 'biddingTeamVP',       options: vpUsers       },
                { roleLabel: 'Sales',    field: 'biddingTeamSales',    options: salesUsers    },
                { roleLabel: 'Presales', field: 'biddingTeamPresales', options: presalesUsers },
                { roleLabel: 'DM',       field: 'biddingTeamDM',       options: dmUsers       },
              ] as const).map(({ roleLabel, field, options }) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0">{roleLabel}</span>
                  <UserSelect value={meta[field]} onChange={v => setField(field, v)}
                    options={options} placeholder={`Select ${roleLabel}`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Win Probability (%)</label>
            <input type="number" min="0" max="100" value={meta.winProbability}
              onChange={e => setField('winProbability', Math.min(100, Math.max(0, Number(e.target.value))).toString())}
              placeholder="e.g. 70" className={inputCls} />
          </div>

          <div>
            <label className={lbl}>Sales Model</label>
            <select value={meta.salesModel} onChange={e => setField('salesModel', e.target.value)} className={selectCls}>
              <option value="">— Select —</option>
              {SALES_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>1st Year Revenue (SGD)</label>
            <input type="text" value={meta.firstYearRevenue} onChange={e => setField('firstYearRevenue', e.target.value)}
              placeholder="e.g. 500K" className={inputCls} />
          </div>

          <div>
            <label className={lbl}>Margin (%)</label>
            <input type="number" min="0" max="100" value={meta.margin}
              onChange={e => setField('margin', Math.min(100, Math.max(0, Number(e.target.value))).toString())}
              placeholder="e.g. 45" className={inputCls} />
          </div>

          <div>
            <label className={lbl}>Contract Term</label>
            <input type="text" value={meta.contractTerm} onChange={e => setField('contractTerm', e.target.value)}
              placeholder="e.g. 3+2 years" className={inputCls} />
          </div>

          <div>
            <label className={lbl}>Qualified</label>
            <div className="flex gap-2">
              <select value={meta.qualified} onChange={e => setField('qualified', e.target.value)}
                className={`${selectCls} w-24 shrink-0`}>
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
              <input type="text" value={meta.qualifiedReason} onChange={e => setField('qualifiedReason', e.target.value)}
                placeholder="Reason…" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={lbl}>Winning Theme</label>
            <input type="text" value={meta.winningTheme} onChange={e => setField('winningTheme', e.target.value)}
              placeholder="e.g. Strong technical expertise" className={inputCls} />
          </div>
        </div>

        {/* ── Sections divider ────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Sections — supports Markdown
          </span>
        </div>

        {/* ── 8 Section textareas ──────────────────────── */}
        <div className="px-3 py-3 flex flex-col gap-4">
          {SECTION_FIELDS.map(({ key, label, placeholder, rows }) => (
            <div key={key}>
              <label className={lbl}>{label}</label>
              <AutoTextarea
                value={sections[key]}
                onChange={v => setSectionField(key, v)}
                placeholder={placeholder}
                rows={rows}
                className={textareaCls}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
