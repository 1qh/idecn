import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
// oxlint-disable-next-line import/no-unassigned-import
import './globals.css'
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang='en' suppressHydrationWarning>
    <body className='min-h-screen antialiased'>
      <NuqsAdapter>
        <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange enableSystem={false}>
          {children}
        </ThemeProvider>
      </NuqsAdapter>
    </body>
  </html>
)
export default RootLayout
