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
                <div class="py-2 -my-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div class="inline-block min-w-full overflow-hidden align-middle border-b border-gray-200 shadow sm:rounded-lg">
                        <table class="min-w-full">
                            <thead>
                                <tr>
                                    <th class="px-6 py-3 text-xs font-medium leading-4 tracking-wider text-left text-gray-500 uppercase border-b border-gray-200 bg-gray-50"
                                        v-for="value in columnHeaders" :key="value">
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

                                    <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200 max-w-min"
                                        v-for="(field, idx) in entry"
                                        :key="idx">
                                        <div class="text-sm leading-5 text-gray-500"> {{ field }} </div>
                                    </td>

                                    <td
                                        class="px-6 py-4 text-sm leading-5 text-gray-500 whitespace-no-wrap border-b border-gray-200">
                                        <Link :href="route(`${pathname}.edit`, {id: entry.id})">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-400" fill="none"
                                              viewBox="0 0 24 24" stroke="currentColor">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </Link>
                                    </td>
                                    <td
                                        class="px-6 py-4 text-sm leading-5 text-gray-500 whitespace-no-wrap border-b border-gray-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-400" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
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
import { onMounted, ref } from 'vue'

export default {
    components: {
        BreezeAuthenticatedLayout,
        Head,
        Link
    },
    setup () {
        const columnData = ref([])
        const columnHeaders = ref([])
        const pathname = window.location.pathname.replace('/', '')
        let title = ref('')

        onMounted(async () => {
          title.value = formatPageTitle(pathname)
          await getData(pathname)
        })

        function addInvariableColumnHeaders() {
          columnHeaders.value.push('Edit')
          columnHeaders.value.push('Delete')
        }

        function addData (dataArr) {
          for (const header of Object.keys(dataArr[0])) {
            columnHeaders.value.push(header)
          }
          addInvariableColumnHeaders()

          for (const entry of dataArr) {
            if (Object.keys(entry).includes('created_at')) {
              entry['created_at'] = formatDateTime(entry['created_at'])
            }
            if (Object.keys(entry).includes('updated_at')) {
              entry['updated_at'] = formatDateTime(entry['updated_at'])
            }
            columnData.value.push(entry)
          }
        }

        async function getData (pathname) {
          let response
          switch (pathname) {
            case 'tracks':
              response = await axios.get('/api/track')
              addData(response.data)
              break
            case 'composers':
              response = await axios.get('/api/composer')
              addData(response.data)
              break
            case 'performances':
              response = await axios.get('/api/performance')
              addData(response.data)
              break
          }
        }

        // Helper functions

        function formatDateTime (mysqlTimestamp) {
          // Split timestamp into [ Y, M, D, h, m, s ]
          const t = mysqlTimestamp.split(/[- : T Z]/)
          // Apply each element to the Date function
          return new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5])).toString().slice(4, 21)
        }

        function formatPageTitle (pathname) {
          return `${pathname[0].toUpperCase()}${pathname.slice(1)}`
        }

        return {
          columnHeaders,
          columnData,
          pathname,
          title,
        }
    }
}
</script>