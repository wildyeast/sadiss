<template>
  <div class="">
    <span class="material-icons mi-play-arrow-rounded text-rose-500 cursor-pointer" />
  </div>
</template>

<script>
import { onMounted, ref, inject, computed } from 'vue'
export default {
  setup () {
    onMounted(() => {
      console.log(123123)
    })
  }
}
</script>