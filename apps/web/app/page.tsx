import { fetchTree } from './actions'
import { DEFAULT_REPO } from './constants'
import Explorer from './explorer'

async function Page() {
 return <Explorer tree={await fetchTree(DEFAULT_REPO)} />
}
export default Page
