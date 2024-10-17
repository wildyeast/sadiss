<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { onUnmounted, ref, useTemplateRef, watch } from "vue"
import IconSearch from "../assets/search.svg"
import IconCross from "../assets/cross.svg"

const emit = defineEmits<{
  (e: "search", query: string): void
}>()

const { t } = useI18n()

const searchQuery = ref("")

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
}

const inputRef = useTemplateRef<HTMLInputElement>("inputRef")

const onClear = () => {
  searchQuery.value = ""
  inputRef.value?.focus()
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
  <div class="border border-secondary flex items-center pr-2 w-[260px]">
    <input
      ref="inputRef"
      type="text"
      v-model="searchQuery"
      @input="onInput"
      :placeholder="t('search')"
      class="bg-white border-none h-[40px] mr-2" />
    <IconSearch v-if="!searchQuery" />
    <button v-else @click="onClear">
      <IconCross class="w-4 h-4" />
    </button>
  </div>
</template>
