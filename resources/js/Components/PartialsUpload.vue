<template>
  <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
    <div class="p-6 bg-white border-b border-gray-200 flex flex-col">
    <label class="pb-6" for="sourcefile">
        Upload a SPEAR partials file
    </label>
        <input
        type="file"
        accept=".txt"
        @input="this.$emit('fileInput', $event.target.files[0])" />
    </div>
  </div>
</template>

<script>
export default {
  setup () {
  }
}
</script>