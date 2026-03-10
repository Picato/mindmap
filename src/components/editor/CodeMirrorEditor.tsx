'use client'

import { useEffect, useRef } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { useTheme } from '@/components/ui/ThemeProvider'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
}

const themeCompartment = new Compartment()

const lightTheme = EditorView.theme({
  '&': { backgroundColor: '#ffffff', color: '#1f2937' },
  '.cm-content': { caretColor: '#4f46e5', padding: '12px 0' },
  '.cm-cursor': { borderLeftColor: '#4f46e5' },
  '.cm-gutters': { backgroundColor: '#f9fafb', color: '#9ca3af', border: 'none', borderRight: '1px solid #e5e7eb' },
  '.cm-activeLineGutter': { backgroundColor: '#f3f4f6' },
  '.cm-activeLine': { backgroundColor: '#f3f4f680' },
  '.cm-selectionBackground': { backgroundColor: '#c7d2fe' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#a5b4fc' },
  '.cm-line': { padding: '0 12px' },
}, { dark: false })

const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1,      color: '#1e3a8a', fontWeight: 'bold', fontSize: '1.1em' },
  { tag: tags.heading2,      color: '#1d4ed8', fontWeight: 'bold' },
  { tag: tags.heading3,      color: '#2563eb', fontWeight: 'bold' },
  { tag: tags.heading,       color: '#4338ca', fontWeight: 'bold' },
  { tag: tags.strong,        color: '#111827', fontWeight: '700' },
  { tag: tags.emphasis,      color: '#374151', fontStyle: 'italic' },
  { tag: tags.link,          color: '#0284c7', textDecoration: 'underline' },
  { tag: tags.url,           color: '#0369a1' },
  { tag: tags.monospace,     color: '#be185d' },
  { tag: tags.quote,         color: '#6b7280', fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#9ca3af' },
  { tag: tags.punctuation,   color: '#6b7280' },
])

const lightBundle = [lightTheme, syntaxHighlighting(lightHighlightStyle)]

export default function CodeMirrorEditor({ value, onChange, onSave }: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  const { theme } = useTheme()

  onChangeRef.current = onChange
  onSaveRef.current = onSave

  // Mount editor once
  useEffect(() => {
    if (!containerRef.current) return

    const saveKeymap = keymap.of([{
      key: 'Mod-s',
      run: () => { onSaveRef.current?.(); return true },
    }])

    const state = EditorState.create({
      doc: value,
      extensions: [
        themeCompartment.of(theme === 'dark' ? oneDark : lightBundle),
        lineNumbers(),
        highlightActiveLine(),
        markdown(),
        saveKeymap,
        keymap.of([...defaultKeymap, indentWithTab]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
        }),
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => { view.destroy(); viewRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Switch theme dynamically without destroying editor
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartment.reconfigure(theme === 'dark' ? oneDark : lightBundle),
    })
  }, [theme])

  // Sync external value changes (template apply, project switch)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />
}
