import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { cn } from '~/lib/utils'
// oxlint-disable-next-line import/no-unassigned-import
import './globals.css'
import { mono, sans } from './fonts'
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html className={cn('font-sans tracking-[-0.02em]', sans.variable, mono.variable)} lang='en' suppressHydrationWarning>
    <body className='min-h-screen antialiased'>
      <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange enableSystem={false}>
        {children}
      </ThemeProvider>
    </body>
  </html>
)
export default RootLayout
