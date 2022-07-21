<template>
  <div>

    <Head title="Dashboard" />

    <BreezeAuthenticatedLayout>
      <template #header>
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
          Dashboard
        </h2>
      </template>
    </BreezeAuthenticatedLayout>
  </div>
</template>

<script>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head, useForm } from '@inertiajs/inertia-vue3'

export default {
  components: {
    BreezeAuthenticatedLayout,
    Head,
  },
  setup () {
    const form = useForm({
      name: null,
      sourcefile: null,
      title: 'title',
      description: 'desc'
    })
    function submit () {
      form.post(`${process.env.MIX_API_SLUG}/track/create`)
    }
    return { form, submit }
  }
}
</script>
