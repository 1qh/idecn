'use client'
import type { RecogitoTextAnnotator, TextAnnotation } from '@recogito/react-text-annotator'
import { cn } from '@a/ui'
import { Annotorious, useAnnotator } from '@annotorious/react'
import { TextAnnotator } from '@recogito/react-text-annotator'
import { useEffect, useRef } from 'react'

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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- useAnnotator returns null until the annotator mounts
    if (anno)
      /** biome-ignore lint/nursery/noUnsafeTypeAssertion: third-party annotator API requires a mutable annotation array */
      anno.setAnnotations(annotations as TextAnnotation[])
  }, [anno, annotations])
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- useAnnotator returns null until the annotator mounts
    if (!anno) return
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
export { TextAnnotationHost }
export type { TextAnnotationHostProps }
