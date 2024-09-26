<script setup lang="ts">
import { useRouter } from "vue-router"
import HeadlineWithCancelButton from "../components/HeadlineWithCancelButton.vue"
import { reactive } from "vue"
import { storePerformance } from "../api"

const router = useRouter()

const formData = reactive({
  name: "",
})

const handleAddPerformance = async () => {
  try {
    await storePerformance(formData.name)
    router.push({ name: "Performances" })
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <div class="w-full px-3">
    <HeadlineWithCancelButton
      :to="{ name: 'Performances' }"
      :text="$t('add_performance')" />
    <form>
      <div class="label-and-input">
        <label for="name" class="label">{{ $t("title") }}</label>
        <input id="name" v-model="formData.name" class="input" type="text" />
      </div>
      <!-- Submit button -->
      <div class="flex justify-end">
        <button
          type="submit"
          class="button-primary"
          @click.prevent="handleAddPerformance">
          {{ $t("add_performance") }}
        </button>
      </div>
    </form>
  </div>
</template>
