'use client'
import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'

function Providers({ children }: { children: ReactNode }) {
 return (
  <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange enableSystem={false}>
    {children}
  </ThemeProvider>
)
}
export { Providers }
