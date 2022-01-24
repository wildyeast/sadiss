<template>
  <div>
    <Head :title="title" />

    <BreezeAuthenticatedLayout>
        <template #header>
          <div class="flex justify-between">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                {{ title }}
            </h2>
          </div>
        </template>
        <div v-for="field in editableFieldsToDisplay" :key="field" class="max-w-7xl mx-auto">
          <input v-if="addOrEdit === 'edit'" type="text" :name="field" :placeholder="field" :value="trackData[id - 1][field]">
          <input v-else type="text" :name="field" :placeholder="field">
        </div>
    </BreezeAuthenticatedLayout>
  </div>
</template>

<script>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head } from '@inertiajs/inertia-vue3'
import { onMounted, ref } from 'vue'

export default {
  components: {
      BreezeAuthenticatedLayout,
      Head,
  },
  setup () {
    let addOrEdit = ''
    const editableFieldsToDisplay = ref([])
    const id = window.location.toString().split('=')[1] // TODO: This is silly. Find different way to get route parameters.
    const pathname = window.location.pathname.replace('/', '')
    let title = formatPageTitle(pathname)
    // Dummy data
    const tracksFields = ['id', 'title', 'description', 'year', 'composer', 'added_on']
    const trackData = [
      {id: 1, title: 'Title1', description: 'Lorem', year: 2022, composer: 'testcomposer', added_on: '2022/1/18'},
      {id: 2, title: 'Title2', description: 'Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem Lorem ', year: 2022, composer: 'testcomposer', added_on: '2022/1/18'},
      {id: 3, title: 'Title3', description: 'Lorem', year: 2022, composer: 'testcomposer', added_on: '2022/1/18'},
      {id: 4, title: 'Title4', description: 'Lorem', year: 2022, composer: 'testcomposer', added_on: '2022/1/18'}
    ]
    const composersFields = ['id', 'name', 'description', 'photo', 'website', 'is_active']
    const composerData = [
      {id: 1, Name: 'Wolf Mozert', description: 'Lorem', photo: 'link-to-photo.com', website: 'wolfi@mozert.at', is_active: false},
      {id: 2, Name: 'Sigfried Beathoven', description: 'Lorem Lorem Lorem', photo: 'link-to-photo.com', website: 'sig.beats@bro.de', is_active: true},
    ]
    const performancesFields = ['id', 'location', 'description', 'start_date', 'end_date']
    const performancesData = [
      {id: 1, location: 'AEC Linz', description: 'Lorem', start_date: '2022/20/1', end_date: '2022/23/1'},
      {id: 2, location: 'Kunsthaus Wien', description: 'Lorem', start_date: '2022/21/1', end_date: '2022/22/1'},
      {id: 3, location: 'MOMA St. Petersburg', description: 'Lorem', start_date: '2022/5/2', end_date: '2022/3/7'},
    ]

    onMounted (() => {
      getData(pathname)
    })

    function getData (pathname) {
      switch (pathname.split('/')[0]) {
        case 'tracks':
          getFieldsToDisplay(tracksFields)
          break
        case 'composers':
          getFieldsToDisplay(composersFields)
          break
        case 'performances':
          getFieldsToDisplay(performancesFields)
          break
      }
    }

    function getFieldsToDisplay(fields) {
      for (const field of fields) {
        editableFieldsToDisplay.value.push(field)
      }
    }

    function formatPageTitle (pathname) {
      const category = pathname.split('/')[0]
      addOrEdit = pathname.split('/')[1]
      return `${addOrEdit[0].toUpperCase()}${addOrEdit.slice(1)} ${category[0].toUpperCase()}${category.slice(1, category.length - 1)}`
    }

    return {
      addOrEdit,
      editableFieldsToDisplay,
      id,
      title,
      trackData
    }
  }
}
</script>