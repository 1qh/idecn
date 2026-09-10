'use client'
import type { LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@a/ui'
import { Button } from '@a/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@a/ui/popover'
import { Spinner } from '@a/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@a/ui/tooltip'
import { NumberField } from '@base-ui/react/number-field'
import { useMemo } from 'react'

type Side = 'bottom' | 'left' | 'right' | 'top'
const CENTER = 'flex h-full items-center justify-center'
const InfoButton = ({
  children,
  icon: Icon,
  label,
  side = 'top'
}: {
  children: ReactNode
  icon: LucideIcon
  label: string
  side?: Side
}) => (
  <Popover>
    <Tooltip>
      <TooltipTrigger
        render={tooltipProps => (
          <PopoverTrigger
            {...tooltipProps}
            render={popoverProps => (
              <Button
                {...popoverProps}
                aria-label={label}
                className='shrink-0 text-muted-foreground'
                size='icon-sm'
                variant='ghost'>
                <Icon className='size-4' />
              </Button>
            )}
          />
        )}
      />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
    <PopoverContent align='start' className='w-fit max-w-[min(28rem,92vw)] p-2 text-xs' side={side} sideOffset={6}>
      {children}
    </PopoverContent>
  </Popover>
)
const IconButton = ({
  busy = false,
  children,
  className,
  disabled = false,
  icon: Icon,
  kbd,
  label,
  onClick,
  reason,
  side,
  ...props
}: Omit<ComponentProps<typeof Button>, 'size' | 'variant'> & {
  busy?: boolean
  icon: LucideIcon
  kbd?: string
  label: string
  reason?: string
  side?: Side
}) => {
  const blocked = disabled && !busy
  return (
    <Tooltip>
      <TooltipTrigger
        render={triggerProps => (
          <Button
            aria-label={label}
            size='icon-sm'
            variant='ghost'
            {...triggerProps}
            {...props}
            aria-disabled={blocked || undefined}
            className={cn(blocked && 'cursor-not-allowed opacity-50', className)}
            disabled={busy}
            onClick={blocked ? undefined : onClick}>
            {busy ? <Spinner className='size-4' /> : (children ?? <Icon className='size-4' />)}
          </Button>
        )}
      />
      <TooltipContent side={side}>
        {blocked && reason !== undefined ? reason : label}
        {kbd === undefined ? null : <kbd className='ml-1 rounded bg-background/20 px-1 font-mono text-[10px]'>{kbd}</kbd>}
      </TooltipContent>
    </Tooltip>
  )
}
const TipButton = ({ children, label, side, ...props }: ComponentProps<'button'> & { label: string; side?: Side }) => (
  <Tooltip>
    <TooltipTrigger
      render={triggerProps => (
        <button aria-label={label} type='button' {...triggerProps} {...props}>
          {children}
        </button>
      )}
    />
    <TooltipContent side={side}>{label}</TooltipContent>
  </Tooltip>
)
interface ScrubInputProps {
  ariaLabel?: string
  className?: string
  label?: string
  max?: number
  min?: number
  onChange: (value: number) => void
  placeholder?: string
  step?: number
  title?: string
  value: null | number
}
const ScrubInput = ({
  ariaLabel,
  className,
  label,
  max,
  min,
  onChange,
  placeholder,
  step,
  title,
  value
}: ScrubInputProps) => {
  const chars = Math.max(2, String(value ?? placeholder ?? '').length)
  const style = useMemo(() => ({ width: `calc(${chars}ch + 1.25rem)` }), [chars])
  let tip = title
  if (label !== undefined) tip = title === undefined ? label : `${label} · ${title}`
  return (
    <NumberField.Root
      className='inline-flex text-xs'
      max={max}
      min={min}
      onValueChange={v => {
        if (v !== null) onChange(v)
      }}
      step={step}
      value={value}>
      <NumberField.ScrubArea className='cursor-ew-resize select-none' title={tip}>
        <NumberField.ScrubAreaCursor className='drop-shadow-sm' />
        <NumberField.Input
          aria-label={ariaLabel ?? label}
          className={cn(
            'h-7 cursor-ew-resize rounded-md border bg-transparent px-2 text-center tabular-nums outline-none focus:ring-1 focus:ring-ring',
            className
          )}
          placeholder={placeholder}
          style={style}
          title={tip}
        />
      </NumberField.ScrubArea>
    </NumberField.Root>
  )
}
export { CENTER, IconButton, InfoButton, ScrubInput, TipButton }
export type { ScrubInputProps, Side }
