<script setup lang="ts">
import { onMounted, ref } from "vue"
import HeadlineWithCancelButton from "../components/HeadlineWithCancelButton.vue"
import { SadissPerformance } from "../types"
import { editPerformance, getPerformance } from "../api"
import { useRouter } from "vue-router"

const router = useRouter()

const props = defineProps<{
  performanceId: string
}>()

const performance = ref<SadissPerformance>()

const formData = ref({
  name: "",
})

const handleEditPerformance = async () => {
  try {
    await editPerformance(props.performanceId, formData.value.name)
    router.push(`/performances`)
  } catch (error) {
    console.error(error)
  }
}

onMounted(async () => {
  performance.value = await getPerformance(props.performanceId)
  formData.value.name = performance.value?.name
})
</script>

<template>
  <div v-if="performance" class="w-full">
    <HeadlineWithCancelButton
      :text="$t('edit_performance') + ': ' + formData.name"
      :to="`/performances`" />
    <form>
      <div class="label-and-input">
        <label for="name">{{ $t("title") }}</label>
        <input type="text" id="name" v-model="formData.name" />
      </div>
      <div class="flex justify-end">
        <button
          type="submit"
          class="button-primary"
          @click.prevent="handleEditPerformance">
          {{ $t("edit_performance") }}
        </button>
      </div>
    </form>
  </div>
</template>
