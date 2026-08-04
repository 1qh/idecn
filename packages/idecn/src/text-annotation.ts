import type { TextAnnotation } from '@recogito/react-text-annotator'

interface ChunkSpan {
  charspan: null | readonly [number, number]
  id: string
  text: string
}
const chunkSpanToAnnotation = (chunk: ChunkSpan): null | TextAnnotation => {
  if (!chunk.charspan || chunk.charspan[0] < 0) return null
  return {
    bodies: [],
    id: chunk.id,
    properties: {},
    target: { annotation: chunk.id, selector: [{ end: chunk.charspan[1], quote: chunk.text, start: chunk.charspan[0] }] }
  }
}
const chunkSpansToAnnotations = (chunks: readonly ChunkSpan[]): TextAnnotation[] => {
  const out: TextAnnotation[] = []
  for (const chunk of chunks) {
    const annotation = chunkSpanToAnnotation(chunk)
    if (annotation) out.push(annotation)
  }
  return out
}
export { chunkSpansToAnnotations, chunkSpanToAnnotation }
export type { ChunkSpan }
