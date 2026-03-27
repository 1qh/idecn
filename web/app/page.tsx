import { fetchTree } from './actions'
import { DEFAULT_REPO } from './constants'
import Explorer from './explorer'
const Page = async () => <Explorer tree={await fetchTree(DEFAULT_REPO)} />
export default Page
