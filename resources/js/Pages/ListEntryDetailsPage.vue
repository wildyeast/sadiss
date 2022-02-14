<template>
    <div>
        <Head title="Details" />

        <BreezeAuthenticatedLayout>
            <template #header>
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Details
                </h2>
            </template>

            <div class="flex w-100 mt-2 px-8 py-8 bg-white border border-gray-200 shadow md:px-6 md:justify-center">
              <template v-if="category === 'composers' && Object.keys(data).length > 0">
                <!-- Left hand side -->
                <div class="flex-1">
                  <div class="flex justify-between w-2/3 text-slate-600 text-sm">
                    <span>Id: {{data['id']}}</span>
                    <span>Created at: {{ data['created_at'] }}</span>
                    <span>Updated at: {{ data['updated_at'] }}</span>
                  </div>
                  <p class="mt-4 text-2xl">{{ data['name'] }}</p>
                </div>
                <!-- Right hand side -->
                <div class="flex-1">

                </div>
              </template>
            </div>
        </BreezeAuthenticatedLayout>
    </div>
</template>

<script>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head, useForm } from '@inertiajs/inertia-vue3'
import { onMounted, reactive, toRefs } from 'vue'

export default {
  components: {
    BreezeAuthenticatedLayout,
    Head,
  },
  setup () {
    const pathname = window.location.pathname.replace('/', '')
    const category = pathname.split('/')[0]
    let routeCategory = ''
    const id = pathname.split('/')[1]
    const data = reactive({})

    onMounted(async () => {
      // TODO: This switch is identical to the one in ListPage.vue. Find a smart way to handle this.
      switch (category) {
        case 'tracks':
          routeCategory = 'track'
          break
        case 'composers':
          routeCategory = 'composer'
          break
        case 'performances':
          routeCategory = 'performance'
          break
      }
      const response = await axios.get(`/api/${routeCategory}/${id}`);
      for (const entry of Object.keys(response.data)) {
        data[entry] = response.data[entry]
      }
    })

    return {
      category,
      data
    }
  }
}
</script>
