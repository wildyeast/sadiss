import { defineStore } from "pinia"
import { Ref, ref } from "vue"

export const useUserStore = defineStore("user", () => {
  const loggedInUserId: Ref<string | null> = ref(null)

  return {
    loggedInUserId,
  }
})
