'use client'
import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react'
const useUncontrolledState = <T>({ defaultProp, onChange }: { defaultProp?: T; onChange?: (value: T) => void }) => {
  const [value, setValue] = useState(defaultProp)
  const prevValueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  useInsertionEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  useEffect(() => {
    if (prevValueRef.current !== value) {
      if (value !== undefined) onChangeRef.current?.(value)
      prevValueRef.current = value
    }
  }, [value])
  return [value, setValue, onChangeRef] as const
}
const useControllableState = <T>({
  defaultProp,
  onChange,
  prop
}: {
  defaultProp?: T
  onChange?: (value: T) => void
  prop?: T
}) => {
  const [uncontrolledProp, setUncontrolledProp, onChangeRef] = useUncontrolledState({
    defaultProp,
    onChange
  })
  const isControlled = prop !== undefined
  const value = isControlled ? prop : uncontrolledProp
  const setValue = useCallback(
    (nextValue: ((prev: T) => T) | T) => {
      if (isControlled) {
        const resolved = typeof nextValue === 'function' ? (nextValue as (prev: T) => T)(prop) : nextValue
        if (resolved !== prop) onChangeRef.current?.(resolved)
      } else setUncontrolledProp(nextValue as T | undefined)
    },
    [isControlled, prop, setUncontrolledProp, onChangeRef]
  )
  return [value, setValue] as const
}
export { useControllableState }
