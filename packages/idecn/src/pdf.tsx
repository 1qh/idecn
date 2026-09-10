/* eslint-disable @eslint-react/set-state-in-effect */
/* oxlint-disable promise/prefer-await-to-then, react-perf/jsx-no-new-object-as-prop */
'use client'
import type { PageViewport, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@a/ui'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Images, Maximize, Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CENTER, TipButton } from './base'

let pdfWorkerSet = false
interface PdfAssets {
  cMapPacked?: boolean
  cMapUrl?: string
  standardFontDataUrl?: string
  wasmUrl?: string
}
const pdfAssets: PdfAssets = {}
const configurePdfAssets = (assets: PdfAssets): void => {
  Object.assign(pdfAssets, assets)
}
const loadPdfjs = async () => {
  const pdfjs = await import('pdfjs-dist')
  if (!(pdfWorkerSet || pdfjs.GlobalWorkerOptions.workerSrc)) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    pdfWorkerSet = true
  }
  return pdfjs
}
type FitMode = 'none' | 'page' | 'width'
const nextFit = (f: FitMode): FitMode => {
  if (f === 'width') return 'page'
  if (f === 'page') return 'none'
  return 'width'
}
const fitLabel = (f: FitMode): string => {
  if (f === 'width') return 'Fit width'
  if (f === 'page') return 'Fit page'
  return 'Manual zoom'
}
interface PdfRegion {
  box: readonly [number, number, number, number]
  color?: string
  id: string
  label?: string
  page: number
}
interface PdfViewerProps {
  className?: string
  controls?: ReactNode
  hoveredRegionIds?: readonly string[]
  onRegionClick?: (id: string) => void
  onRegionDraw?: (box: readonly [number, number, number, number], page: number) => void
  onRegionHover?: (id: null | string) => void
  onRegionResize?: (id: string, box: readonly [number, number, number, number], page: number) => void
  regions?: readonly PdfRegion[]
  scale?: number
  selectedRegionId?: null | string
  selectedRegionIds?: readonly string[]
  src: string
}
interface RegionDrag {
  id: string
  mode: ResizeMode
  x0: number
  x1: number
  y0: number
  y1: number
}
type ResizeMode = 'move' | 'ne' | 'nw' | 'se' | 'sw'
const nextBox = (d: RegionDrag, dx: number, dy: number): RegionDrag => {
  if (d.mode === 'move') return { ...d, x0: d.x0 + dx, x1: d.x1 + dx, y0: d.y0 + dy, y1: d.y1 + dy }
  const west = d.mode === 'nw' || d.mode === 'sw'
  const north = d.mode === 'nw' || d.mode === 'ne'
  return {
    ...d,
    x0: west ? d.x0 + dx : d.x0,
    x1: west ? d.x1 : d.x1 + dx,
    y0: north ? d.y0 + dy : d.y0,
    y1: north ? d.y1 : d.y1 + dy
  }
}
const RESIZE_CORNERS = [
  { cursor: 'nwse-resize', mode: 'nw', style: { left: -4, top: -4 } },
  { cursor: 'nesw-resize', mode: 'ne', style: { right: -4, top: -4 } },
  { cursor: 'nesw-resize', mode: 'sw', style: { bottom: -4, left: -4 } },
  { cursor: 'nwse-resize', mode: 'se', style: { bottom: -4, right: -4 } }
] as const
interface ViewportGeom {
  convertToPdfPoint: (x: number, y: number) => [number, number]
  convertToViewportPoint: (x: number, y: number) => [number, number]
}
/** biome-ignore lint/nursery/noUnsafeTypeAssertion: pdfjs viewport exposes the required geometry methods without the local interface */
const vpGeom = (vp: PageViewport): ViewportGeom => vp as unknown as ViewportGeom
const pdfBoxStyle = (vp: PageViewport, box: readonly [number, number, number, number]) => {
  const [x1, y1] = vpGeom(vp).convertToViewportPoint(box[0], box[1])
  const [x2, y2] = vpGeom(vp).convertToViewportPoint(box[2], box[3])
  return { height: Math.abs(y2 - y1), left: Math.min(x1, x2), top: Math.min(y1, y2), width: Math.abs(x2 - x1) }
}
const PdfPage = ({
  active = true,
  hoveredSet,
  onRegionClick,
  onRegionDraw,
  onRegionHover,
  onRegionResize,
  pageNo,
  pageSize,
  pdf,
  regions,
  scale,
  selectedRegionId,
  selectedSet
}: {
  active?: boolean
  hoveredSet: ReadonlySet<string>
  onRegionClick?: (id: string) => void
  onRegionDraw?: (box: readonly [number, number, number, number], page: number) => void
  onRegionHover?: (id: null | string) => void
  onRegionResize?: (id: string, box: readonly [number, number, number, number], page: number) => void
  pageNo: number
  pageSize?: { h: number; w: number }
  pdf: PDFDocumentProxy
  regions: readonly PdfRegion[]
  scale: number
  selectedRegionId: null | string
  selectedSet: ReadonlySet<string>
}) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const taskRef = useRef<null | RenderTask>(null)
  const selectedRef = useRef<HTMLElement>(null)
  const setSelRef = useCallback((el: HTMLElement | null) => {
    selectedRef.current = el
  }, [])
  const [vp, setVp] = useState<PageViewport>()
  const renderedScaleRef = useRef<number | undefined>(undefined)
  const [renderedScale, setRenderedScale] = useState<number | undefined>(undefined)
  const [drag, setDrag] = useState<null | { x0: number; x1: number; y0: number; y1: number }>(null)
  const [rDrag, setRDrag] = useState<null | RegionDrag>(null)
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const movedRef = useRef(false)
  const rStart = (e: ReactPointerEvent<HTMLElement>, id: string, mode: ResizeMode) => {
    if (!onRegionResize || e.button !== 0) return
    const r = regions.find(x => x.id === id)
    if (!(r && vp)) return
    e.stopPropagation()
    const [x0, y0] = vpGeom(vp).convertToViewportPoint(r.box[0], r.box[1])
    const [x1, y1] = vpGeom(vp).convertToViewportPoint(r.box[2], r.box[3])
    originRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    setRDrag({ id, mode, x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1) })
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const rMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!rDrag) return
    movedRef.current = true
    setRDrag(nextBox(rDrag, e.clientX - originRef.current.x, e.clientY - originRef.current.y))
    originRef.current = { x: e.clientX, y: e.clientY }
  }
  const rEnd = () => {
    if (!(rDrag && vp && onRegionResize)) return setRDrag(null)
    if (movedRef.current) {
      const [px0, py0] = vpGeom(vp).convertToPdfPoint(Math.min(rDrag.x0, rDrag.x1), Math.min(rDrag.y0, rDrag.y1))
      const [px1, py1] = vpGeom(vp).convertToPdfPoint(Math.max(rDrag.x0, rDrag.x1), Math.max(rDrag.y0, rDrag.y1))
      onRegionResize(rDrag.id, [px0, py0, px1, py1], pageNo)
    }
    setRDrag(null)
  }
  const drawStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!onRegionDraw || e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDrag({ x0: e.clientX - rect.left, x1: e.clientX - rect.left, y0: e.clientY - rect.top, y1: e.clientY - rect.top })
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const drawMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDrag({ ...drag, x1: e.clientX - rect.left, y1: e.clientY - rect.top })
  }
  const drawEnd = () => {
    if (!(drag && vp && onRegionDraw)) return setDrag(null)
    const [x0, y0] = vpGeom(vp).convertToPdfPoint(Math.min(drag.x0, drag.x1), Math.min(drag.y0, drag.y1))
    const [x1, y1] = vpGeom(vp).convertToPdfPoint(Math.max(drag.x0, drag.x1), Math.max(drag.y0, drag.y1))
    if (Math.abs(drag.x1 - drag.x0) > 4 && Math.abs(drag.y1 - drag.y0) > 4) onRegionDraw([x0, y0, x1, y1], pageNo)
    setDrag(null)
  }
  const pageRegions = regions.filter(r => r.page === pageNo)
  const selectedOnPage = selectedRegionId !== null && pageRegions.some(r => r.id === selectedRegionId)
  useEffect(() => {
    if (selectedOnPage && vp) selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedOnPage, vp])
  useEffect(() => {
    const controller = new AbortController()
    const draw = async () => {
      const page = await pdf.getPage(pageNo)
      controller.signal.throwIfAborted()
      const viewport = page.getViewport({ scale })
      const canvas = ref.current
      const ctx = canvas?.getContext('2d')
      if (!(canvas && ctx)) return
      const prev = taskRef.current
      prev?.cancel()
      await prev?.promise.catch(() => undefined)
      controller.signal.throwIfAborted()
      const dpr = Math.max(1, globalThis.devicePixelRatio)
      canvas.width = Math.ceil(viewport.width * dpr)
      canvas.height = Math.ceil(viewport.height * dpr)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      const task = page.render({
        canvas,
        canvasContext: ctx,
        transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0],
        viewport
      })
      taskRef.current = task
      try {
        await task.promise
      } catch {
        return
      }
      controller.signal.throwIfAborted()
      setVp(viewport)
      renderedScaleRef.current = scale
      setRenderedScale(scale)
    }
    if (active) {
      const delay = renderedScaleRef.current === undefined ? 0 : 140
      const timer = setTimeout(() => {
        draw().catch(() => undefined)
      }, delay)
      return () => {
        clearTimeout(timer)
        controller.abort()
        taskRef.current?.cancel()
      }
    }
    return () => {
      controller.abort()
      taskRef.current?.cancel()
    }
  }, [active, pdf, pageNo, scale])
  const previewRatio = renderedScale === undefined ? 1 : scale / renderedScale
  let layoutWidth: number | undefined
  let layoutHeight: number | undefined
  if (vp) {
    layoutWidth = vp.width * previewRatio
    layoutHeight = vp.height * previewRatio
  } else if (pageSize) {
    layoutWidth = pageSize.w * scale
    layoutHeight = pageSize.h * scale
  }
  return (
    <div
      className='relative w-fit scroll-mt-12 border-b border-border/40 pb-2 last:border-b-0'
      id={`pdf-page-${pageNo}`}
      style={
        layoutWidth && layoutHeight
          ? {
              height: layoutHeight,
              transform: `scale(${String(previewRatio)})`,
              transformOrigin: 'top left',
              width: layoutWidth
            }
          : undefined
      }>
      <canvas aria-label={`Page ${pageNo}`} className='block' ref={ref} />
      {onRegionDraw && vp ? (
        <div
          className='absolute inset-0 cursor-crosshair'
          onPointerDown={drawStart}
          onPointerMove={drawMove}
          onPointerUp={drawEnd}
          style={{ height: vp.height, width: vp.width }}>
          {drag ? (
            <div
              className='absolute border-2 border-primary bg-primary/15'
              style={{
                height: Math.abs(drag.y1 - drag.y0),
                left: Math.min(drag.x0, drag.x1),
                top: Math.min(drag.y0, drag.y1),
                width: Math.abs(drag.x1 - drag.x0)
              }}
            />
          ) : null}
        </div>
      ) : null}
      {vp
        ? pageRegions.map((r, i) => {
            const color = r.color ?? 'var(--primary)'
            const isSelected = r.id === selectedRegionId || selectedSet.has(r.id)
            const isHovered = hoveredSet.has(r.id)
            const editable = r.id === selectedRegionId && Boolean(onRegionResize)
            const activeDrag = rDrag?.id === r.id ? rDrag : null
            const geom = activeDrag
              ? {
                  height: Math.abs(activeDrag.y1 - activeDrag.y0),
                  left: Math.min(activeDrag.x0, activeDrag.x1),
                  top: Math.min(activeDrag.y0, activeDrag.y1),
                  width: Math.abs(activeDrag.x1 - activeDrag.x0)
                }
              : pdfBoxStyle(vp, r.box)
            const fill = { backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`, borderColor: color }
            const key = `${r.id}-${String(i)}`
            if (!editable)
              return (
                <button
                  aria-label={r.label ?? `region ${r.id}`}
                  className={cn(
                    'absolute rounded-sm border-2 transition-[filter] hover:brightness-125',
                    isSelected && 'animate-pulse ring-2 ring-offset-1',
                    isHovered && !isSelected && 'brightness-125 ring-1 ring-offset-1'
                  )}
                  key={key}
                  onClick={() => onRegionClick?.(r.id)}
                  onPointerEnter={() => onRegionHover?.(r.id)}
                  onPointerLeave={() => onRegionHover?.(null)}
                  ref={r.id === selectedRegionId ? setSelRef : undefined}
                  style={{ ...geom, ...fill }}
                  title={r.label}
                  type='button'
                />
              )
            return (
              <button
                aria-label={r.label ?? `region ${r.id}`}
                className='absolute animate-pulse cursor-move touch-none rounded-sm border-2 ring-2 ring-offset-1'
                key={key}
                onClick={() => {
                  if (movedRef.current) return
                  onRegionClick?.(r.id)
                }}
                onPointerDown={e =>
                  rStart(
                    e,
                    r.id,
                    /** biome-ignore lint/nursery/noUnsafeTypeAssertion: DOM data attribute crosses the ResizeMode union boundary */
                    ((e.target instanceof HTMLElement ? e.target.dataset.mode : undefined) as ResizeMode | undefined) ??
                      'move'
                  )
                }
                onPointerMove={rMove}
                onPointerUp={rEnd}
                ref={setSelRef}
                style={{ ...geom, ...fill }}
                type='button'>
                {RESIZE_CORNERS.map(c => (
                  <span
                    className='absolute block size-2 rounded-full border border-background bg-primary'
                    data-mode={c.mode}
                    key={c.mode}
                    style={{ ...c.style, cursor: c.cursor }}
                  />
                ))}
              </button>
            )
          })
        : null}
    </div>
  )
}
const NO_REGIONS: readonly PdfRegion[] = []
const PdfThumb = ({
  active,
  onClick,
  pageNo,
  pdf
}: {
  active: boolean
  onClick: () => void
  pageNo: number
  pdf: PDFDocumentProxy
}) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const taskRef = useRef<null | RenderTask>(null)
  useEffect(() => {
    let cancelled = false
    const draw = async () => {
      const page = await pdf.getPage(pageNo)
      const viewport = page.getViewport({ scale: 0.18 })
      const canvas = ref.current
      const ctx = canvas?.getContext('2d')
      if (!(canvas && ctx) || cancelled) return
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      taskRef.current?.cancel()
      const task = page.render({ canvas, canvasContext: ctx, viewport })
      taskRef.current = task
      await task.promise.catch(() => undefined)
    }
    draw().catch(() => undefined)
    return () => {
      cancelled = true
      taskRef.current?.cancel()
    }
  }, [pdf, pageNo])
  return (
    <button
      aria-label={`Go to page ${String(pageNo)}`}
      className={cn(
        'flex shrink-0 flex-col items-center gap-0.5 rounded border p-1 hover:bg-accent',
        active && 'border-primary bg-accent'
      )}
      onClick={onClick}
      type='button'>
      <canvas aria-hidden className='block' ref={ref} />
      <span className='text-[10px] tabular-nums text-muted-foreground'>{pageNo}</span>
    </button>
  )
}
const TBTN = 'rounded p-1 hover:bg-accent'
const PdfViewer = ({
  className,
  controls,
  hoveredRegionIds,
  onRegionClick,
  onRegionDraw,
  onRegionHover,
  onRegionResize,
  regions = NO_REGIONS,
  scale,
  selectedRegionId = null,
  selectedRegionIds,
  src
}: PdfViewerProps) => {
  const selectedSet = useMemo(() => new Set(selectedRegionIds), [selectedRegionIds])
  const hoveredSet = useMemo(() => new Set(hoveredRegionIds), [hoveredRegionIds])
  const [doc, setDoc] = useState<PDFDocumentProxy>()
  const [zoom, setZoom] = useState(scale ?? 1.4)
  const [fit, setFit] = useState<FitMode>('width')
  const [base, setBase] = useState<null | { h: number; w: number }>(null)
  const [box, setBox] = useState({ h: 0, w: 0 })
  const [page, setPage] = useState(1)
  const [showThumbs, setShowThumbs] = useState(false)
  const [showRegions, setShowRegions] = useState(true)
  const [activePages, setActivePages] = useState<ReadonlySet<number>>(() => new Set([1]))
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let active = true
    let loaded: PDFDocumentProxy | undefined
    setDoc(undefined)
    setBase(null)
    setPage(1)
    setActivePages(new Set([1]))
    const run = async () => {
      const pdfjs = await loadPdfjs()
      const d = await pdfjs.getDocument({ url: src, ...pdfAssets }).promise.catch(() => undefined)
      if (!d) return
      loaded = d
      const v = (await d.getPage(1)).getViewport({ scale: 1 })
      if (active) {
        setDoc(d)
        setBase({ h: v.height, w: v.width })
      }
    }
    run().catch(() => undefined)
    return () => {
      active = false
      loaded?.cleanup().catch(() => undefined)
    }
  }, [src])
  useEffect(() => {
    const root = scrollRef.current
    if (!(root && doc)) return
    const ro = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect
      if (r) setBox({ h: r.height, w: r.width })
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [doc])
  useEffect(() => {
    if (selectedRegionId === null || !doc) return
    const target = regions.find(r => r.id === selectedRegionId)?.page
    if (target === undefined) return
    scrollRef.current
      ?.querySelector(`#pdf-page-${String(target)}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedRegionId, regions, doc])
  useEffect(() => {
    const root = scrollRef.current
    if (!(root && doc)) return
    const observer = new IntersectionObserver(
      entries => {
        const top = entries.filter(e => e.isIntersecting).toSorted((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (top) setPage(Number(top.target.id.replace('pdf-page-', '')))
        setActivePages(previous => {
          const next = new Set(previous)
          for (const entry of entries) {
            const pageNo = Number(entry.target.id.replace('pdf-page-', ''))
            if (entry.isIntersecting) next.add(pageNo)
            else next.delete(pageNo)
          }
          return next
        })
      },
      { root, threshold: [0.1, 0.5, 0.9] }
    )
    for (let n = 1; n <= doc.numPages; n += 1) {
      const el = root.querySelector(`#pdf-page-${String(n)}`)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [doc])
  const jump = (n: number): void => {
    scrollRef.current?.querySelector(`#pdf-page-${String(n)}`)?.scrollIntoView({ behavior: 'smooth' })
  }
  if (!doc) return <div className={cn(CENTER, 'text-sm text-muted-foreground', className)}>Loading…</div>
  const pages = Array.from({ length: doc.numPages }, (_, i) => i + 1)
  let effZoom = zoom
  if (!(fit === 'none' || !base || box.w === 0))
    effZoom =
      fit === 'width'
        ? Math.max(0.2, (box.w - 24) / base.w)
        : Math.max(0.2, Math.min((box.w - 24) / base.w, (box.h - 24) / base.h))
  const pageOverflow = Boolean(base && box.w > 0 && base.w * effZoom > box.w)
  const setManualZoom = (next: number): void => {
    setFit('none')
    setZoom(next)
  }
  return (
    <div className={cn('relative flex h-full overflow-hidden', className)}>
      {showThumbs ? (
        <div className='flex w-28 shrink-0 flex-col gap-1 overflow-auto border-r p-1'>
          {pages.map(n => (
            <PdfThumb active={n === page} key={n} onClick={() => jump(n)} pageNo={n} pdf={doc} />
          ))}
        </div>
      ) : null}
      <div className='relative min-w-0 flex-1 overflow-hidden'>
        <div
          className={cn(
            'flex h-full flex-col gap-0 overflow-auto bg-muted/20 p-2 [scrollbar-gutter:stable]',
            pageOverflow ? 'items-start' : 'items-center'
          )}
          ref={scrollRef}>
          {pages.map(n => (
            <PdfPage
              active={activePages.has(n)}
              hoveredSet={hoveredSet}
              key={n}
              onRegionClick={onRegionClick}
              onRegionDraw={onRegionDraw}
              onRegionHover={onRegionHover}
              onRegionResize={onRegionResize}
              pageNo={n}
              pageSize={base ?? undefined}
              pdf={doc}
              regions={showRegions ? regions : NO_REGIONS}
              scale={effZoom}
              selectedRegionId={selectedRegionId}
              selectedSet={selectedSet}
            />
          ))}
        </div>
        <div className='absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/90 px-2 py-1 text-xs shadow-md backdrop-blur'>
          <TipButton aria-pressed={showThumbs} className={TBTN} label='Thumbnails' onClick={() => setShowThumbs(t => !t)}>
            <Images className='size-3.5' />
          </TipButton>
          <TipButton
            className={TBTN}
            disabled={page <= 1}
            label='Previous page'
            onClick={() => jump(Math.max(1, page - 1))}>
            <ChevronLeft className='size-3.5' />
          </TipButton>
          <span className='tabular-nums'>
            {page}/{doc.numPages}
          </span>
          <TipButton
            className={TBTN}
            disabled={page >= doc.numPages}
            label='Next page'
            onClick={() => jump(Math.min(doc.numPages, page + 1))}>
            <ChevronRight className='size-3.5' />
          </TipButton>
          <TipButton
            className={TBTN}
            label='Zoom out'
            onClick={() => setManualZoom(Math.max(0.4, Math.round((effZoom - 0.2) * 10) / 10))}>
            <Minus className='size-3.5' />
          </TipButton>
          <span className='tabular-nums'>{Math.round(effZoom * 100)}%</span>
          <TipButton
            className={TBTN}
            label='Zoom in'
            onClick={() => setManualZoom(Math.min(4, Math.round((effZoom + 0.2) * 10) / 10))}>
            <Plus className='size-3.5' />
          </TipButton>
          <TipButton aria-pressed={fit !== 'none'} className={TBTN} label={fitLabel(fit)} onClick={() => setFit(nextFit)}>
            <Maximize className='size-3.5' />
          </TipButton>
          {regions.length > 0 ? (
            <TipButton
              aria-pressed={showRegions}
              className={TBTN}
              label='Toggle regions'
              onClick={() => setShowRegions(s => !s)}>
              {showRegions ? <Eye className='size-3.5' /> : <EyeOff className='size-3.5' />}
            </TipButton>
          ) : null}
          {controls}
        </div>
      </div>
    </div>
  )
}
export { configurePdfAssets, PdfViewer }
export type { PdfRegion, PdfViewerProps }
