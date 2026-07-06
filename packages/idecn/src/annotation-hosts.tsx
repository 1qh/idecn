'use client'
import type { GridCell, GridColumn, Item } from '@glideapps/glide-data-grid'
import type { RecogitoTextAnnotator, TextAnnotation } from '@recogito/react-text-annotator'
import { cn } from '@a/ui'
import { Annotorious, useAnnotator } from '@annotorious/react'
import { DataEditor, GridCellKind } from '@glideapps/glide-data-grid'
import { TextAnnotator } from '@recogito/react-text-annotator'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import '@glideapps/glide-data-grid/dist/index.css'

interface GridEditorHostProps {
  className?: string
  columns: readonly string[]
  onCellSelect?: (col: number, row: number) => void
  rows: readonly (readonly string[])[]
}
interface TextAnnotationHostProps {
  annotations?: readonly TextAnnotation[]
  className?: string
  onCreateSelection?: (span: { end: number; start: number }) => void
  onSelect?: (ids: readonly string[]) => void
  text: string
}
const NO_ANNOTATIONS: readonly TextAnnotation[] = []
const charOffset = (root: Node, node: Node, offset: number): number => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let total = 0
  let current = walker.nextNode()
  while (current) {
    if (current === node) return total + offset
    total += current.textContent?.length ?? 0
    current = walker.nextNode()
  }
  return total
}
const AnnotatorBinding = ({
  annotations,
  onSelect
}: {
  annotations: readonly TextAnnotation[]
  onSelect?: (ids: readonly string[]) => void
}) => {
  const anno = useAnnotator<RecogitoTextAnnotator>()
  useEffect(() => {
    anno.setAnnotations(annotations as TextAnnotation[])
  }, [anno, annotations])
  useEffect(() => {
    const handler = (selected: TextAnnotation[]) => onSelect?.(selected.map(s => s.id))
    anno.on('selectionChanged', handler)
    return () => {
      anno.off('selectionChanged', handler)
    }
  }, [anno, onSelect])
  return null
}
const TextAnnotationHost = ({
  annotations = NO_ANNOTATIONS,
  className,
  onCreateSelection,
  onSelect,
  text
}: TextAnnotationHostProps) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!(onCreateSelection && root)) return
    const handler = () => {
      const sel = globalThis.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      if (!root.contains(range.commonAncestorContainer)) return
      const a = charOffset(root, range.startContainer, range.startOffset)
      const b = charOffset(root, range.endContainer, range.endOffset)
      const start = Math.min(a, b)
      const end = Math.max(a, b)
      if (end > start) onCreateSelection({ end, start })
    }
    root.addEventListener('mouseup', handler)
    return () => {
      root.removeEventListener('mouseup', handler)
    }
  }, [onCreateSelection])
  return (
    <Annotorious>
      <TextAnnotator>
        <div className={cn('whitespace-pre-wrap break-words p-3 text-sm leading-relaxed', className)} ref={ref}>
          {text}
        </div>
      </TextAnnotator>
      <AnnotatorBinding annotations={annotations} onSelect={onSelect} />
    </Annotorious>
  )
}
const GridEditorHost = ({ className, columns, onCellSelect, rows }: GridEditorHostProps) => {
  const cols: GridColumn[] = useMemo(() => columns.map(title => ({ id: title, title, width: 160 })), [columns])
  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const data = rows[row]?.[col] ?? ''
      return { allowOverlay: false, data, displayData: data, kind: GridCellKind.Text }
    },
    [rows]
  )
  return (
    <div className={cn('size-full', className)}>
      <DataEditor
        columns={cols}
        getCellContent={getCellContent}
        onGridSelectionChange={sel => {
          const c = sel.current?.cell
          if (c) onCellSelect?.(c[0], c[1])
        }}
        rows={rows.length}
      />
    </div>
  )
}
export { GridEditorHost, TextAnnotationHost }
export type { GridEditorHostProps, TextAnnotationHostProps }
