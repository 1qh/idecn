interface AppState {
  activeTab?: string
  expanded?: string[]
  layout?: unknown
  repo: string
  sidebarWidth?: number
}
const compress = async (data: string): Promise<string> => {
    const bytes = new TextEncoder().encode(data),
      cs = new CompressionStream('deflate-raw'),
      writer = cs.writable.getWriter()
    writer.write(bytes)
    writer.close()
    const buffer = await new Response(cs.readable).arrayBuffer()
    return btoa(String.fromCodePoint(...new Uint8Array(buffer)))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '')
  },
  /** biome-ignore lint/suspicious/useAwait: returns awaited Response.text() */
  decompress = async (encoded: string): Promise<string> => {
    const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/'),
      binary = atob(base64),
      bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.codePointAt(i) ?? 0
    const ds = new DecompressionStream('deflate-raw'),
      writer = ds.writable.getWriter()
    writer.write(bytes)
    writer.close()
    return new Response(ds.readable).text()
  },
  saveState = async (state: AppState) => {
    const json = JSON.stringify(state),
      hash = await compress(json)
    globalThis.history.replaceState(null, '', `#${hash}`)
  },
  loadState = async (): Promise<AppState | null> => {
    const hash = globalThis.location.hash.slice(1)
    if (!hash) return null
    try {
      const json = await decompress(hash)
      return JSON.parse(json) as AppState
    } catch {
      return null
    }
  }
export type { AppState }
export { loadState, saveState }
