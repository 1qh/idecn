import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
// oxlint-disable-next-line import/no-unassigned-import
import './globals.css'
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang='en' suppressHydrationWarning>
    <body className='min-h-screen antialiased'>
      <ThemeProvider attribute='class' defaultTheme='dark'>
        {children}
      </ThemeProvider>
    </body>
  </html>
)
export default RootLayout
