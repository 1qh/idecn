import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { mono, sans } from './fonts'
// oxlint-disable-next-line import/no-unassigned-import
import './globals.css'
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html className={`font-sans ${sans.variable} ${mono.variable}`} lang='en' suppressHydrationWarning>
    <body className='min-h-screen antialiased'>
      <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange enableSystem={false}>
        {children}
      </ThemeProvider>
    </body>
  </html>
)
export default RootLayout
