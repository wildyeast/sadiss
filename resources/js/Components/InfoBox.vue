<template>
  <div class="border-1 border-solid border-black font-mono">
    <div :class="['p-1', bgcolor ? `bg-${bgcolor}` : 'bg-primary', 'text-white', 'uppercase']">{{ title }}</div>       
    <div class=""><slot /></div>
  </div>
</template>

<script>
export default {
    props: ['title', 'bgcolor'],
    methods: {
    }
}
</script>