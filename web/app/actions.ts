'use server'
import { readFile as read } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = resolve(process.cwd(), '..'),
  readFile = async (path: string): Promise<null | string> => {
    const full = resolve(root, path)
    if (!full.startsWith(root)) return null
    try {
      return await read(full, 'utf8')
    } catch {
      return null
    }
  }
export { readFile }
