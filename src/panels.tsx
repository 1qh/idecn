'use client'
import type { IDockviewPanelHeaderProps, IDockviewPanelProps } from 'dockview-react'
import type { ReactNode } from 'react'
import { Editor } from '@monaco-editor/react'
import { X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { FileIcon } from './icon'
const EDITOR_OPTIONS = { minimap: { enabled: false }, readOnly: true, scrollBeyondLastLine: false } as const,
  CustomPanelInner = ({ api, params }: IDockviewPanelProps<{ content: ReactNode }>) => {
    const [content, setContent] = useState(params.content)
    useEffect(() => {
      const d = api.onDidParametersChange(e => {
        const p = e as { content?: ReactNode }
        if (p.content !== undefined) setContent(p.content)
      })
      return () => {
        d.dispose()
      }
    }, [api])
    return <div className='h-full overflow-auto'>{content}</div>
  },
  FilePanelInner = ({ api, params }: IDockviewPanelProps<{ content: string; language: string; loading?: ReactNode }>) => {
    const { resolvedTheme } = useTheme(),
      [content, setContent] = useState(params.content),
      [language, setLanguage] = useState(params.language),
      [loadingState, setLoadingState] = useState(params.loading)
    useEffect(() => {
      const d = api.onDidParametersChange(e => {
        const p = e as { content?: string; language?: string; loading?: ReactNode }
        if (p.content !== undefined) {
          setContent(p.content)
          setLoadingState(undefined)
        }
        if (p.language !== undefined) setLanguage(p.language)
        if (p.loading !== undefined) setLoadingState(p.loading)
      })
      return () => {
        d.dispose()
      }
    }, [api])
    if (loadingState) return <div className='flex h-full items-center justify-center'>{loadingState}</div>
    if (!content)
      return <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>Empty file</div>
    return (
      <Editor
        language={language}
        options={EDITOR_OPTIONS}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        value={content}
      />
    )
  },
  TabHeaderInner = ({ api }: IDockviewPanelHeaderProps) => (
    <div className='group/tab flex h-full items-center'>
      <FileIcon className='size-4 shrink-0 [&_svg]:size-4' name={api.title ?? ''} />
      <span className='mb-px ml-0.5'>{api.title}</span>
      <X
        className='ml-1 size-3.5 stroke-[1.5] opacity-0 hover:cursor-pointer group-hover/tab:opacity-70'
        onClick={e => {
          e.stopPropagation()
          api.close()
        }}
      />
    </div>
  )
export { CustomPanelInner, FilePanelInner, TabHeaderInner }
