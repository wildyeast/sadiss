<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { onUnmounted, ref, watch } from "vue"
import IconSearch from "../assets/search.svg"

const emit = defineEmits<{
  (e: "search", query: string): void
}>()

const { t } = useI18n()

const searchQuery = ref("")

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
}

watch(searchQuery, newVal => {
  emit("search", newVal)
})

onUnmounted(() => {
  searchQuery.value = ""
  emit("search", "")
})
</script>

<template>
  <div class="border border-secondary flex items-center pr-2">
    <input
      type="text"
      v-model="searchQuery"
      @input="onInput"
      :placeholder="t('search')"
      class="bg-white border-none h-[40px]" />
    <IconSearch />
  </div>
</template>
