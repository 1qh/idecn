import type { ReactNode } from 'react'
import { cn } from '@a/ui'
// oxlint-disable-next-line import/no-unassigned-import
import './globals.css'
import { mono, sans } from './fonts'
import { Providers } from './providers'
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html className={cn('font-sans tracking-[-0.02em]', sans.variable, mono.variable)} lang='en' suppressHydrationWarning>
    <body className='min-h-screen antialiased'>
      <Providers>{children}</Providers>
    </body>
  </html>
)
export default RootLayout
