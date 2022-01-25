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
        <!-- TODO: Replace dbColumnInfo[0] with loadingFinished bool -->
        <!-- <div v-if="dbColumnInfo[0]" class="mt-8 max-w-7xl mx-auto py-2 -my-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-white border-b border-gray-200 shadow sm:rounded-lg"> -->
        <div v-if="dbColumnInfo[0]" class="mt-8 max-w-7xl mx-auto py-6 -my-2 sm:px-6 lg:px-8 bg-white border-gray-200 shadow sm:rounded-lg">
          <div v-for="field in dbColumnInfo[0].data" :key="field">
            <div class="flex flex-col">
              <label :for="field.Field">{{ formatLabel(field.Field) }}</label>
              <div v-if="field.Type !== 'text'">
                <input v-if="addOrEdit === 'edit'" :type="getInputType(field.Type)" :name="field.Field" :placeholder="field.Field" :value="dbData[id - 1]['data'][field.Field]">
                <input v-else :type="getInputType(field.Type)" :name="field.Field" :placeholder="field.Field">
              </div>
              <div v-else>
                <textarea v-if="addOrEdit === 'edit'" :placeholder="field.Field" :value="dbData[id - 1]['data'][field.Field]"/>
                <textarea v-else :placeholder="field.Field" />
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <span>Loading...</span>
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
    const dbColumnInfo = ref([])
    const dbData = ref([])
    const id = window.location.toString().split('=')[1] // TODO: This is silly. Find different way to get route parameters.
    const loadingFinished = ref(false)
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

    onMounted (async () => {
      await getData(pathname)
      const data = await axios.get('/track/columns');
      dbColumnInfo.value.push(data)
      loadingFinished.value = true
    })

    function getInputType(dbType) {
      switch (dbType) {
        case 'bigint unsigned':
        case 'id':
          return 'number'
        case 'timestamp':
          return 'datetime-local';
        case 'varchar(255)':
          return 'text'
      }
    }

    async function getData (pathname) {
      switch (pathname.split('/')[0]) {
        case 'tracks':
          await getFieldsToDisplay(tracksFields)
          break
        case 'composers':
          getFieldsToDisplay(composersFields)
          break
        case 'performances':
          getFieldsToDisplay(performancesFields)
          break
      }
    }

    async function getFieldsToDisplay(fields) {
      const data = await axios.get(`/track/${id}`)
      dbData.value.push(data)
    }

    function formatLabel(labelText) {
      return `${labelText[0].toUpperCase()}${labelText.slice(1)}`.replace('_', ' ')
    }

    function formatPageTitle (pathname) {
      const category = pathname.split('/')[0]
      addOrEdit = pathname.split('/')[1]
      return `${addOrEdit[0].toUpperCase()}${addOrEdit.slice(1)} ${category[0].toUpperCase()}${category.slice(1, category.length - 1)}`
    }

    return {
      addOrEdit,
      dbColumnInfo,
      dbData,
      formatLabel,
      getInputType,
      id,
      loadingFinished,
      title,
      trackData
    }
  }
}
</script>