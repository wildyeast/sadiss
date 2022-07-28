<template>
  <div class="flex
              flex-col
              bg-white
              p-6
              border-1
              rounded-bulma-input-border-radius
              border-bulma-input-border
              hover:border-bulma-input-border-hover">
    <label class="pb-6"
           for="sourcefile">
      Upload a SPEAR partials file
    </label>
    <input type="file"
           accept=".txt"
           @input="this.$emit('fileInput', $event.target)" />
  </div>
</template>

<script>
export default {
  setup () {
  }
}
</script>
