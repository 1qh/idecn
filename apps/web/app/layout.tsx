import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { cn } from '@a/ui'
import './global.css'
import { mono, sans } from './fonts'
import { Providers } from './providers'

const metadata: Metadata = {
  title: 'idecn'
}
function Layout({ children }: { children: ReactNode }) {
 return (
  // biome-ignore lint/nursery/noUndeclaredClasses: standard tailwind-v4 utilities (font-sans, tracking-*) not resolved by the scanner
  <html className={cn('font-sans tracking-[-0.02em]', sans.variable, mono.variable)} lang='en' suppressHydrationWarning>
    {/* biome-ignore lint/nursery/noUndeclaredClasses: standard tailwind-v4 utilities (min-h-screen, antialiased) not resolved by the scanner */}
    <body className='min-h-screen antialiased'>
      <Providers>{children}</Providers>
    </body>
  </html>
)
}
export { metadata }
export default Layout
