// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- typed JSON boundary: each caller declares the parsed shape
const parseJson = <T>(text: string): T =>
  /** biome-ignore lint/nursery/noUnsafeTypeAssertion: single validated JSON parse boundary */
  JSON.parse(text) as T
export { parseJson }
