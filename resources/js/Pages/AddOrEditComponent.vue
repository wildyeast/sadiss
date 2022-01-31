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
        <div v-if="loadingFinished" class="mt-8 max-w-7xl mx-auto py-6 -my-2 sm:px-6 lg:px-8 bg-white border-gray-200 shadow sm:rounded-lg">
          <form @submit.prevent="submit">
          <div v-for="field in fields[0]" :key="field">
            <!-- 1: {{form[field[Field]]}} 2: {{field.Field}} 3: {{form}} -->
            <div class="flex flex-col">
              <label :for="field.Field">{{ formatLabel(field.Field) }}</label>
              <div v-if="field.Field === 'partials'">
                <PartialsUpload @fileInput="onPartialsFileInput"/>
              </div>
              <div v-else-if="field.Type !== 'text'">
                <input :type="getInputType(field.Type)" :name="form.Field" :placeholder="field.Field" v-model="form[field.Field]">
              </div>
              <div v-else>
                <textarea :placeholder="field.Field" v-model="form[field.Field]"/>
              </div>
            </div>
          </div>
          <Button>Submit</Button>
          </form>
        </div>
        <div v-else>
          <span>Loading...</span>
        </div>
    </BreezeAuthenticatedLayout>
  </div>
</template>

<script>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head, useForm } from '@inertiajs/inertia-vue3'
import { computed, onMounted, ref } from 'vue'
import PartialsUpload from '@/Components/PartialsUpload'

export default {
  components: {
      BreezeAuthenticatedLayout,
      Head,
      PartialsUpload
  },
  setup () {
    let addOrEdit = ''
    const dbColumnInfo = ref([])
    const dbData = ref([])
    const id = window.location.toString().split('=')[1] // TODO: $route is undefined, need to expose somehow?
    const loadingFinished = ref(false)
    const pathname = window.location.pathname.replace('/', '')
    const category = pathname.split('/')[0]
    let title = formatPageTitle(pathname)
    const trackForm = {
      id: null,
      created_at: null,
      updated_at: null,
      title: '',
      description: '',
      partials: ''
    }
    const composerForm = {
      id: null,
      created_at: null,
      updated_at: null,
      name: '',
      description: '',
      photo: '',
      website_url: '',
      is_active: null
    }
    const performanceForm = {
      id: null,
      created_at: null,
      updated_at: null,
      location: '',
      start_time: null,
      end_time: null,
      is_active: null
    }
    const trackFields = Object.keys(trackForm)
    const composerFields = Object.keys(composerForm)
    const performanceFields = Object.keys(performanceForm)
    let form = ref({})
    // computed(() => {
    //   let formToUse
    //   switch (category) {
    //     case 'tracks':
    //       formToUse = trackForm
    //       break
    //     case 'composers':
    //       formToUse = composerForm
    //       break
    //     case 'performances':
    //       formToUse = performanceForm
    //       break
    //   }
    //   return useForm(formToUse)
    // })
    // const fields = computed(() => {
    //   let fieldsToUse
    //   switch (category) {
    //     case 'tracks':
    //       fieldsToUse = trackFields
    //       break
    //     case 'composers':
    //       fieldsToUse = composerFields
    //       break
    //     case 'performances':
    //       fieldsToUse = performanceFields
    //       break
    //   }
    //   return fieldsToUse
    // })
    const fields = ref([])

    onMounted (async () => {
      switch (category) {
        case 'tracks':
          form.value = trackForm
          break
        case 'composers':
          form.value = composerForm
          break
        case 'performances':
          form.value = performanceForm
          break
      }

      if (addOrEdit == 'edit') {
        await getData(pathname)
      }

      const response = await axios.get('/api/track/columns');
      fields.value.push(response.data)

      // for (const column of dbColumnInfo.value[0].data) {
      //   form[0][column.Field] = null
      // }

      // if (dbData.value.length > 0) {
      //   for (const column of Object.keys(dbData.value[0].data)) {
      //     form[0][column] = dbData.value[0].data[column]
      //   }
      // }
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
      let routeCategory
      let formToUse
      switch (category) {
        case 'tracks':
          routeCategory = 'track'
          formToUse = trackForm
          break
        case 'composers':
          routeCategory = 'composer'
          formToUse = composerForm
          break
        case 'performances':
          routeCategory = 'performance'
          formToUse = performanceForm
          break
      }
      const response = await axios.get(`/api/${routeCategory}/${id}`)
      for (const field of Object.keys(response.data)) {
        formToUse[field] = response.data[field]
      }
    }

    function formatLabel(labelText) {
      return `${labelText[0].toUpperCase()}${labelText.slice(1)}`.replace('_', ' ')
    }

    function formatPageTitle (pathname) {
      const category = pathname.split('/')[0]
      addOrEdit = pathname.split('/')[1]
      return `${addOrEdit[0].toUpperCase()}${addOrEdit.slice(1)} ${category[0].toUpperCase()}${category.slice(1, category.length - 1)}`
    }

    function onPartialsFileInput (value) {
      form.value['sourcefile'] = value
    }

    function submit () {
      useForm(form.value).post('/api/track/create')
    }

    return {
      addOrEdit,
      dbColumnInfo,
      dbData,
      form,
      formatLabel,
      getInputType,
      id,
      loadingFinished,
      title,
      onPartialsFileInput,
      submit,
      fields
    }
  }
}
</script>