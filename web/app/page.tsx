import { readTree } from './actions'
import Explorer from './explorer'
import { buildTree } from './utils'
const Page = async () => {
  const raw = await readTree(),
    tree = buildTree(raw)
  return <Explorer tree={tree} />
}
export default Page
