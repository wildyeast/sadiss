import { reactive } from 'vue'
import { usePlayer } from './usePlayer'

const { setMotionRef } = usePlayer()

export function useMCorp() {
  const initializeMCorp = async () => {
    // @ts-expect-error: Can't find name MCorp, which is added via <script> in index.html
    // eslint-disable-next-line
    const mCorpApp = MCorp.app(import.meta.env.VITE_APP_MCORP_API_KEY, { anon: true })
    mCorpApp.run = () => {
      const motion = reactive(mCorpApp.motions['shared'])
      setMotionRef(motion)
    }
    mCorpApp.init()
  }

  return { initializeMCorp }
}
