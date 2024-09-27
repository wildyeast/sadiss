import { defineStore } from "pinia"
import { Ref, ref } from "vue"
import { SadissPerformance } from "../types"
import { getPerformances } from "../api"

export const usePerformanceStore = defineStore("performance", () => {
  const performances: Ref<SadissPerformance[]> = ref([])
  const loading = ref(false)

  const loadPerformances = async () => {
    loading.value = true
    try {
      performances.value = await getPerformances()
    } catch (error) {
      console.error("Error loading tracks:", error)
    } finally {
      loading.value = false
    }
  }

  return {
    performances,
    loading,
    loadPerformances,
  }
})
