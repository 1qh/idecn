import { DEFAULT_FILES, DEFAULT_REPO } from './constants'
const readHash = () => {
    if (!('location' in globalThis)) return { files: [] as string[], repo: DEFAULT_REPO }
    const hash = globalThis.location.hash.slice(1)
    if (!hash) return { files: DEFAULT_FILES, repo: DEFAULT_REPO }
    const [repo, ...files] = hash.split(',')
    return { files: files.filter(Boolean), repo: repo || DEFAULT_REPO }
  },
  writeHash = (repo: string, files: string[]) => {
    const hash = [repo, ...files].join(',')
    globalThis.history.replaceState(null, '', files.length > 0 ? `#${hash}` : globalThis.location.pathname)
  }
export { readHash, writeHash }
