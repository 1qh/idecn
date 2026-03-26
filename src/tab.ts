/* eslint-disable @eslint-react/no-unused-props, @typescript-eslint/no-unused-vars */
import type { ReactNode } from 'react'
interface TabProps {
  children: ReactNode
  closable?: boolean
  icon?: boolean
  id?: string
  onClose?: () => void
  position?: 'bottom' | 'left' | 'right'
  title: string
}
const TAB_TYPE = Symbol('idecn-tab'),
  Tab = (_props: TabProps): null => null
Tab._type = TAB_TYPE
export type { TabProps }
export { Tab, TAB_TYPE }
