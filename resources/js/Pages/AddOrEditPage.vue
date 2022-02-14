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
          <div v-if="addOrEdit === 'edit'">
            <p v-for="field in Object.keys(fields).filter(field => !fields[field].editable)" :key="field">{{ field }}: {{ form[field] }}</p>
          </div>
          <form @submit.prevent="submit">
            <div v-for="field in Object.keys(fields)" :key="field">
              <div class="flex flex-col" v-if="fields[field].editable">
                <label :for="field">{{ formatLabel(field) }}</label>
                <div v-if="field === 'partials'">
                  <PartialsUpload @fileInput="onPartialsFileInput"/>
                </div>
                <div v-else-if="fields[field].type === 'datetime'">
                  <o-datetimepicker rounded placeholder="Click to select..." locale="en-GB" v-model="form[field]" />
                </div>
                <div v-else-if="getInputType(fields[field].type) === 'checkbox'">
                  <o-switch rounded v-model="form[field]" />
                </div>
                <div v-else-if="fields[field].type !== 'text'">
                  <o-input rounded :type="getInputType(fields[field].type)" v-model="form[field]" />
                </div>
                <div v-else>
                  <o-input rounded type="textarea" v-model="form[field]"/>
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
import { computed, onMounted, reactive, ref, inject } from 'vue'
import PartialsUpload from '@/Components/PartialsUpload'

export default {
  components: {
      BreezeAuthenticatedLayout,
      Head,
      PartialsUpload
  },
  setup () {
    const oruga = inject('oruga')

    let addOrEdit = ''
    const id = window.location.toString().split('=')[1] // TODO: $route is undefined, need to expose somehow?
    const loadingFinished = ref(false)
    const pathname = window.location.pathname.replace('/', '')
    const category = pathname.split('/')[0]
    let title = formatPageTitle(pathname)
    const fields = reactive({})
    const form = reactive({})
    let routeCategory = ''

    onMounted (async () => {
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

      for (const field of response.data) {
        fields[field.Field] = {
          type: field.Type,
          editable: isEditable(field.Field)
        }
      }

      if (addOrEdit == 'edit') {
        await getData(routeCategory)
      }

      loadingFinished.value = true
    })

    function getInputType(dbType) {
      switch (dbType) {
        case 'bigint unsigned':
        case 'id':
          return 'number'
        case 'timestamp':
        // case 'datetime':
        //   return 'datetime-local';
        case 'varchar(255)':
          return 'text'
        case 'tinyint(1)':
          return 'checkbox'
      }
    }

    async function getData (routeCategory) {
      const response = await axios.get(`/api/${routeCategory}/${id}`)
      for (const field of Object.keys(response.data)) {
        if (field === 'start_time' || field == 'end_time') {
          form[field] = formatDateForDatetimePicker(response.data[field])
        } else {
          form[field] = response.data[field]
        }
      }
    }

    function isEditable(field) {
      const nonEditableFields = ['id', 'created_at', 'updated_at']
      return !nonEditableFields.includes(field)
    }

    function formatDateForDatetimePicker(datestring) {
      const d = datestring.split(/[. :]/)
      return new Date(d[2], d[1], d[0], d[3], d[4])
    }

    function onPartialsFileInput (value) {
      form['sourcefile'] = value
    }

    function submit () {
      // TODO: Do formatting somewhere else (during v-model?)
      // Oruga datetimepicker has a datetimeFormatter prop, maybe this helps https://oruga.io/components/datetimepicker.html
      const formattedForm = {}
      for (const field of Object.keys(form)) {
        if (field === 'start_time' || field == 'end_time') {
          const d = form[field]
          formattedForm[field] = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
        } else {
          formattedForm[field] = form[field]
        }
      }
      if (addOrEdit === 'add') {
        useForm(formattedForm).post(`/api/${routeCategory}/create`)
      } else if (addOrEdit === 'edit') {
        useForm(formattedForm).post(`/api/${routeCategory}/edit/${id}`)
      }
      oruga.notification.open({
        message: 'Success!',
        rootClass: 'toast-notification',
        position: 'bottom',
        queue: true,
        duration: 4000
      })
    }

    // Helper functions
    function formatLabel(labelText) {
      return `${labelText[0].toUpperCase()}${labelText.slice(1)}`.replace('_', ' ')
    }

    function formatPageTitle (pathname) {
      addOrEdit = pathname.split('/')[1]
      return `${addOrEdit[0].toUpperCase()}${addOrEdit.slice(1)} ${category[0].toUpperCase()}${category.slice(1, category.length - 1)}`
    }

    return {
      addOrEdit,
      fields,
      form,
      formatLabel,
      getInputType,
      id,
      isEditable,
      loadingFinished,
      title,
      onPartialsFileInput,
      submit,
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