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
                <div v-if="detectedLanguages">
                  Detected languages:<br>
                  {{ detectedLanguages.join(', ') }}
                </div>
              </div>
              <div v-else-if="category === 'performances' && field === 'tts_languages'"
                   class="flex
                          flex-col
                          bg-white
                          p-6
                          border-1
                          rounded-bulma-input-border-radius
                          border-bulma-input-border
                          hover:border-bulma-input-border-hover">
                <label class="pb-2">
                  Choose allowed TTS languages
                </label>
                <div v-for="lang of Object.keys(allowedTtsLanguages)"
                     class="flex items-center gap-2">
                  <input v-model="allowedTtsLanguages[lang]"
                         type="checkbox" />
                  <label>{{ lang }}</label>
                </div>
              </div>
              <span v-else-if="field === 'tts_languages'"></span>
              <div v-else-if="field === 'is_choir'">
                <o-switch v-model="form[field]"
                          disabled />
              </div>
              <div v-else-if="field === 'output_device'"
                   class="flex
                          justify-around
                          bg-white
                          p-6
                          border-1
                          rounded-bulma-input-border-radius
                          border-bulma-input-border
                          hover:border-bulma-input-border-hover">
                <div v-for="(device, idx) of ['Speakers', 'Headphones', 'Both']"
                     class="flex items-center gap-2">
                  <input type="radio"
                         name="output_devices"
                         :value="idx"
                         v-model="form[field]">
                  <label>{{ device }}</label>
                </div>
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
import { validateTtsInstructions, validationResult } from '@/TtsInstructionsJsonValidation'

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

    const category = ref(path.name)
    let title = formatPageTitle(path)
    const fields = reactive({})
    const form = reactive({})
    let routeCategory = ''

    onMounted(async () => {
      switch (category.value) {
        case 'tracks':
          routeCategory = 'track'
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

    const detectedLanguages = ref()
    async function onTtsInstructionsFileInput (eventTarget) {
      detectedLanguages.value = null

      const file = eventTarget.files[0]

      const validationResult = await validateTtsInstructions(file)
      if (typeof validationResult === 'string') {
        alert(validationResult)
        return
      } else {
        form['is_choir'] = validationResult.isChoir
        detectedLanguages.value = validationResult.detectedLanguages
      }

      form['tts_instructions_file_name'] = eventTarget.value.split('\\').reverse()[0]
      form['tts_instructions'] = file
    }

    const allowedTtsLanguages = ref({
      'en-US': false,
      'de-DE': false
    })

    function submit () {
      const formattedForm = {}
      for (const field of Object.keys(form)) {
        formattedForm[field] = form[field]
      }

      if (category.value === 'performances') {
        if (!formattedForm['title']) {
          alert('Enter a title.')
          return
        } else if (!formattedForm['output_device']) {
          alert('Select an output device.')
          return
        }
        // Create array of allowed languages from allowedTtsLanguages
        const ttsLanguages = Object.keys(allowedTtsLanguages.value).filter(lang => allowedTtsLanguages.value[lang])
        formattedForm['ttsLanguages'] = ttsLanguages
      } else if (category.value === 'tracks') {
        formattedForm['ttsLanguages'] = detectedLanguages.value
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
      return `${labelText[0].toUpperCase()}${labelText.slice(1)}`.replace(/_/g, ' ')
    }

    function formatPageTitle () {
      return `${path.type[0].toUpperCase()}${path.type.slice(1)} ${path.name[0].toUpperCase()}${path.name.slice(1, path.name.length - 1)}`
    }

    return {
      category,
      detectedLanguages,
      fields,
      form,
      formatLabel,
      getInputType,
      id,
      isEditable,
      loadingFinished,
      title,
      allowedTtsLanguages,
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
