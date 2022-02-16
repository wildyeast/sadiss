<template>
    <div>
        <Head title="Details" />

        <BreezeAuthenticatedLayout>
            <template #header>
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Details
                </h2>
            </template>

            <div v-if="Object.keys(data).length > 0" class="w-100 mt-2 py-8 bg-white border border-gray-200 shadow md:px-6 md:justify-center">
              <div class="flex flex-col max-w-7xl mx-auto px-4">
                <div class="flex justify-between w-1/3 mb-4 text-slate-600 text-sm">
                  <span>Id: {{data['id']}}</span>
                  <span>Created at: {{ data['created_at'] }}</span>
                  <span>Updated at: {{ data['updated_at'] }}</span>
                </div>
                <template v-if="category === 'composers'">
                  <div class="flex">
                    <!-- Left hand side -->
                    <div class="flex-1">
                      <p class="mb-4 text-2xl">{{ data['name'] }}</p>
                      <p class="text-justify">{{ data['description'] }}</p>
                    </div>
                    <!-- Right hand side -->
                    <div class="flex-1 flex flex-col items-center">
                      <img :src="data['photo']" alt="An image of the composer." class="w-1/2 mb-4">
                      <div class="flex flex-col items-center w-1/2 border border-bulma-input-border rounded-bulma-input-border-radius">
                        <p class="py-4 border-b border-bulma-input-border">Website</p>
                        <a :href="data['website_url']" class="py-4 text-center">{{ data['website_url'] }}</a>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
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
