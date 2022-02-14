<template>
    <div>
        <Head :title="title" />

        <BreezeAuthenticatedLayout>
            <template #header>
              <div class="flex justify-between">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    {{ title }}
                </h2>
                <Link class="hover:underline" :href="route(`${pathname}.add`)">Add</Link>
              </div>
            </template>
            <!-- Below is adapted from Example 4 from here https://larainfo.com/blogs/tailwind-css-simple-table-example -->
            <div class="flex flex-col mt-8 max-w-7xl mx-auto">
                <div class="py-2 -my-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div class="inline-block min-w-full overflow-hidden align-middle border-b border-gray-200 shadow sm:rounded-lg">
                        <table class="min-w-full text-center">
                            <thead>
                                <tr>
                                  <th class="px-2 py-3 text-xs font-medium leading-4 tracking-wider text-gray-500 uppercase border-b border-gray-200 bg-gray-50"
                                      v-for="value in columnNames" :key="value">
                                      {{ value }}
                                  </th>
                                </tr>
                            </thead>

                            <tbody class="bg-white">
                                <tr v-for="entry in columnData" :key="entry.id">
                                    <!-- <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0 w-10 h-10">
                                                <img class="w-10 h-10 rounded-full" src="https://source.unsplash.com/user/erondu"
                                                    alt="admin dashboard ui">
                                            </div>

                                            <div>
                                                <div class="text-sm font-medium leading-5 text-gray-900">
                                                    {{ entry.id }}
                                                </div>
                                            </div>
                                        </div>
                                    </td> -->

                                    <td class="px-2 py-4 whitespace-no-wrap border-b border-gray-200 max-w-min"
                                        v-for="(field, idx) in entry"
                                        :key="idx">
                                        <div class="text-sm leading-5 text-gray-500"> {{ field }} </div>
                                    </td>

                                    <td class="px-2 py-4 text-sm leading-5 whitespace-no-wrap border-b border-gray-200">
                                        <Link :href="route(`${pathname}.edit`, {id: entry.id})">
                                          <span class="material-icons mi-edit text-blue-500" />
                                        </Link>
                                    </td>
                                    <td class="px-2 py-4 text-sm leading-5 whitespace-no-wrap border-b border-gray-200">
                                        <span class="material-icons mi-delete text-rose-500 cursor-pointer" @click="deleteRow(entry.id)" />
                                    </td>
                                    <td class="px-2 py-4 text-sm leading-5 whitespace-no-wrap border-b border-gray-200">
                                        <Link :href="route(`${pathname}.show`, {id: entry.id})">
                                          <span class="material-icons mi-arrow-forward-ios text-gray-500" />
                                        </Link>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </BreezeAuthenticatedLayout>
    </div>
</template>

<script>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head, Link } from '@inertiajs/inertia-vue3'
import { onMounted, ref, inject } from 'vue'

export default {
    components: {
        BreezeAuthenticatedLayout,
        Head,
        Link
    },
    setup () {
        const oruga = inject('oruga')

        const columnData = ref([])
        const columnNames = ref([])
        const pathname = window.location.pathname.replace('/', '')
        const category = pathname.split('/')[0]
        let routeCategory = ''
        const title = ref('')

        onMounted(async () => {
          title.value = formatPageTitle(pathname)

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

          const response = await axios.get(`/api/${routeCategory}/columns`);
          for (const column of response.data) {
            columnNames.value.push(column.Field)
          }
          addAdditionColumns()

          await addData()
        })

        // Adds columns that are not present in the database
        function addAdditionColumns() {
          columnNames.value.push('Edit')
          columnNames.value.push('Delete')
          columnNames.value.push('Details')
        }

        async function addData () {
          const response = await axios.get(`/api/${routeCategory}`)
          for (const entry of response.data) {
            // if (Object.keys(entry).includes('created_at')) {
            //   entry['created_at'] = formatDateTime(entry['created_at'])
            // }
            // if (Object.keys(entry).includes('updated_at')) {
            //   entry['updated_at'] = formatDateTime(entry['updated_at'])
            // }
            columnData.value.push(entry)
          }
        }

        async function deleteRow (id) {
          if (confirm(`Do you really want to delete this ${routeCategory}? This cannot be reversed.`)) {
            await axios.post(`/api/${routeCategory}/delete/${id}`)
            columnData.value = columnData.value.filter(row => row.id !== id)
          }
          oruga.notification.open({
            message: 'Deletion successful!',
            rootClass: 'toast-notification',
            position: 'bottom',
            queue: true,
            duration: 4000
          })
        }

        // Helper functions
        function formatPageTitle (pathname) {
          return `${pathname[0].toUpperCase()}${pathname.slice(1)}`
        }

        return {
          columnNames,
          columnData,
          deleteRow,
          pathname,
          title,
        }
    }
}
</script>

<style>
  .toast-notification {
    margin: 0.5em 0;
    text-align: center;
    box-shadow: 0 1px 4px rgb(0 0 0 / 12%), 0 0 6px rgb(0 0 0 / 4%);
    border-radius: 2em;
    padding: 0.75em 1.5em;
    pointer-events: auto;
    color: rgba(0, 0, 0, 0.7);
    background: #f0ead6;
  }
</style>