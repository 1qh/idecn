'use client'
import type { GridCell, GridColumn, Item } from '@glideapps/glide-data-grid'
import { cn } from '@a/ui'
import { DataEditor, GridCellKind } from '@glideapps/glide-data-grid'
import { useCallback, useMemo } from 'react'
import '@glideapps/glide-data-grid/dist/index.css'

interface GridEditorHostProps {
  className?: string
  columns: readonly string[]
  onCellSelect?: (col: number, row: number) => void
  rows: readonly (readonly string[])[]
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
export { GridEditorHost }
export type { GridEditorHostProps }
