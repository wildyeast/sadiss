<template>
  <div>

    <Head :title="title" />

    <BreezeAuthenticatedLayout>
      <template #header>
        <div class="flex justify-between">
          <h2 class="uppercase font-semibold font-mono text-xl text-white leading-tight">
            {{ title }}
          </h2>
        </div>
      </template>
      <div v-if="loadingFinished"
           class="flex flex-col items-center mt-2 px-2 py-8 bg-white border border-gray-200 shadow md:px-6 md:justify-center">
        <div v-if="path.type === 'edit'"
             class="inline-block w-full mb-4 text-slate-400 text-xs md:w-1/2">
          <p v-for="field in Object.keys(fields).filter(field => !fields[field].editable)"
             :key="field">{{ field }}: {{ form[field] }}</p>
        </div>
        <form @submit.prevent="submit"
              class="inline-block w-full md:w-1/2">
          <div v-for="field in Object.keys(fields)"
               :key="field">
            <div class="flex flex-col"
                 v-if="fields[field].editable">
              <label :for="field">{{ formatLabel(field) }}</label>
              <div v-if="field === 'partials'">
                <PartialsUpload @fileInput="onPartialsFileInput" />
              </div>
              <div v-else-if="field === 'tts_instructions'"
                   class="flex
                            flex-col
                            bg-white
                            p-6
                            border-1
                            rounded-bulma-input-border-radius
                            border-bulma-input-border
                            hover:border-bulma-input-border-hover">
                <label class="pb-6">
                  Upload a Text-To-Speech instructions file
                </label>
                <input type="file"
                       accept=".json"
                       @input="onTtsInstructionsFileInput($event.target)" />
              </div>
              <div v-else-if="fields[field].type === 'datetime'">
                <o-datetimepicker placeholder="Click to select..."
                                  locale="en-GB"
                                  icon="event"
                                  v-model="form[field]" />
              </div>
              <div v-else-if="getInputType(fields[field].type) === 'checkbox'">
                <o-switch v-model="form[field]" />
              </div>
              <div v-else-if="fields[field].type !== 'text'">
                <o-input :type="getInputType(fields[field].type)"
                         v-model="form[field]" />
              </div>
              <div v-else>
                <o-input type="textarea"
                         v-model="form[field]" />
              </div>
            </div>
          </div>
          <div class="flex justify-center mt-2">
            <Button>
              <o-button>Submit</o-button>
            </Button>
          </div>
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

    const id = window.location.toString().split('=')[1] // TODO: $route is undefined, need to expose somehow?
    const loadingFinished = ref(false)

    const path = reactive({
      name: '',
      type: '' // Types are 'add' and 'edit'
    })

    const pathSplit = window.location.pathname.split('/')

    path.name = pathSplit[pathSplit.length - 2]
    path.type = pathSplit[pathSplit.length - 1]

    const category = path.name
    let title = formatPageTitle(path)
    const fields = reactive({})
    const form = reactive({})
    let routeCategory = ''

    onMounted(async () => {
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

      const response = await axios.get(`${process.env.MIX_API_SLUG}/${routeCategory}/columns`);

      for (const field of response.data) {
        fields[field.Field] = {
          type: field.Type,
          editable: isEditable(field.Field)
        }
      }

      if (path.type == 'edit') {
        await getData(routeCategory)
      }

      loadingFinished.value = true
    })

    function getInputType (dbType) {
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
      const response = await axios.get(`${process.env.MIX_API_SLUG}/${routeCategory}/${id}`)
      for (const field of Object.keys(response.data)) {
        if (field === 'start_time' || field == 'end_time') {
          form[field] = formatDateForDatetimePicker(response.data[field])
        } else {
          form[field] = response.data[field]
        }
      }
    }

    function isEditable (field) {
      const nonEditableFields = ['id', 'created_at', 'updated_at']
      return !nonEditableFields.includes(field)
    }

    function formatDateForDatetimePicker (datestring) {
      const d = datestring.split(/[. :]/)
      return new Date(d[2], d[1], d[0], d[3], d[4])
    }

    function onPartialsFileInput (eventTarget) {
      form['partials_file_name'] = eventTarget.value.split('\\').reverse()[0]
      form['sourcefile'] = eventTarget.files[0]
    }
    function onTtsInstructionsFileInput (eventTarget) {
      form['tts_instructions_file_name'] = eventTarget.value.split('\\').reverse()[0]
      form['tts_instructions'] = eventTarget.files[0]
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
      if (path.type === 'add') {
        useForm(formattedForm).post(`${process.env.MIX_API_SLUG}/${routeCategory}/create`)
      } else if (path.type === 'edit') {
        useForm(formattedForm).post(`${process.env.MIX_API_SLUG}/${routeCategory}/edit/${id}`)
      }
      oruga.notification.open({
        message: 'Success!',
        rootClass: 'toast-notification',
        position: 'bottom',
        queue: true,
        duration: 4000
      })
      window.history.back();
    }

    // Helper functions
    function formatLabel (labelText) {
      return `${labelText[0].toUpperCase()}${labelText.slice(1)}`.replace('_', ' ')
    }

    function formatPageTitle () {
      return `${path.type[0].toUpperCase()}${path.type.slice(1)} ${path.name[0].toUpperCase()}${path.name.slice(1, path.name.length - 1)}`
    }

    return {
      fields,
      form,
      formatLabel,
      getInputType,
      id,
      isEditable,
      loadingFinished,
      title,
      onPartialsFileInput,
      onTtsInstructionsFileInput,
      path,
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
