<template>
  <div class="px-1 flex flex-row justify-between">
    <div class="lowercase whitespace-nowrap">
      {{ name }}
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>

<script>
export default {
    props: ['name'],
    methods: {
    }
}
</script>