import { ref } from "vue"

const globalTime = ref(-1)
export const mCorpIsInitialized = ref(false)

export function useMCorp() {
  let motion: any
  const initializeMCorp = async () => {
    if (motion) {
      console.error("Tried to initialize MCorp twice")
    }

    // @ts-ignore: Can't find name MCorp, which is added via <script> in index.html
    const mCorpApp = MCorp.app(import.meta.env.VITE_APP_MCORP_API_KEY, {
      anon: true,
    })
    mCorpApp.run = () => {
      motion = mCorpApp.motions["shared"]
      startClock()
      mCorpIsInitialized.value = true
    }
    mCorpApp.init()
  }

  const startClock = () => {
    setInterval(() => {
      globalTime.value = motion.pos
    }, 10)
  }

  const getGlobalTime = () => {
    return globalTime.value
  }

  return { initializeMCorp, getGlobalTime, mCorpIsInitialized }
}
