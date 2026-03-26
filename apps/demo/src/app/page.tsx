'use client'
import type { TreeNode } from 'nicetree'
import { FileTree } from 'nicetree'
import { useState } from 'react'
const DEMO_TREE: TreeNode[] = [
    {
      children: [
        { name: 'index.ts', path: 'src/index.ts' },
        { name: 'utils.ts', path: 'src/utils.ts' },
        {
          children: [
            { name: 'button.tsx', path: 'src/components/button.tsx' },
            { name: 'input.tsx', path: 'src/components/input.tsx' }
          ],
          name: 'components',
          path: 'src/components'
        }
      ],
      name: 'src',
      path: 'src'
    },
    { name: 'package.json', path: 'package.json' },
    { name: 'tsconfig.json', path: 'tsconfig.json' },
    { name: 'README.md', path: 'README.md' }
  ],
  Page = () => {
    const [selected, setSelected] = useState<null | string>(null)
    return (
      <div className='flex h-screen'>
        <div className='w-64 overflow-auto border-r border-border bg-accent/30'>
          <FileTree nodes={DEMO_TREE} onSelect={setSelected} selected={selected} />
        </div>
        <div className='flex flex-1 items-center justify-center text-muted-foreground'>{selected ?? 'Select a file'}</div>
      </div>
    )
  }
export default Page
