import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { cn } from '@a/ui'
import './global.css'
import { mono, sans } from './fonts'
import { Providers } from './providers'
const metadata: Metadata = {
  title: 'idecn'
}
const Layout = ({ children }: { children: ReactNode }) => (
  <html className={cn('font-sans tracking-[-0.02em]', sans.variable, mono.variable)} lang='en' suppressHydrationWarning>
    <body className='min-h-screen antialiased'>
      <Providers>{children}</Providers>
    </body>
  </html>
)
export { metadata }
export default Layout
