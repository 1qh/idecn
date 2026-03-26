'use client'
import type { IDockviewPanelHeaderProps, IDockviewPanelProps } from 'dockview-react'
import { Editor } from '@monaco-editor/react'
import { FileIcon } from 'idecn'
import { XIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
const EDITOR_OPTIONS = { minimap: { enabled: false }, readOnly: true, scrollBeyondLastLine: false } as const,
  FilePanel = ({ params }: IDockviewPanelProps<{ content: string; language: string }>) => {
    const { resolvedTheme } = useTheme()
    return (
      <Editor
        language={params.language}
        options={EDITOR_OPTIONS}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        value={params.content}
      />
    )
  },
  FileTab = ({ api }: IDockviewPanelHeaderProps) => (
    <div className='group/tab flex h-full items-center'>
      <FileIcon className='size-4 shrink-0 [&_svg]:size-4' name={api.title ?? ''} />
      <span className='mb-px ml-0.5'>{api.title}</span>
      <button
        className='opacity-0 hover:cursor-pointer group-hover/tab:opacity-70'
        onClick={e => {
          e.stopPropagation()
          api.close()
        }}
        type='button'>
        <XIcon className='stroke-1 size-4' />
      </button>
    </div>
  )
export { FilePanel, FileTab }
