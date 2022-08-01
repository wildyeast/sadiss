<script setup>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head, useForm } from '@inertiajs/inertia-vue3'
import { onMounted, reactive, ref, inject } from 'vue'
import PartialsUpload from '@/Components/PartialsUpload'
import { validateTtsInstructions } from '@/TtsInstructionsJsonValidation'

const oruga = inject('oruga')

const id = window.location.toString().split('=')[1] // TODO: $route is undefined, need to expose somehow?
const loadingFinished = ref(false)

const path = reactive({
  type: '' // Types are 'add' and 'edit'
})

const pathSplit = window.location.pathname.split('/')

path.type = pathSplit[pathSplit.length - 1]

const title = ref(path.type === 'add' ? 'Add Track' : 'Edit Track')

const form = ref({
  id: null,
  created_at: null,
  updated_at: null,
  title: '',
  description: '',
  partials: '',
  partials_file_name: '',
  tts_instructions: '',
  tts_instructions_file_name: '',
  tts_languages: '',
  is_choir: null
})

onMounted(async () => {
  if (path.type == 'edit') {
    await getData()
  }
  loadingFinished.value = true
})


async function getData () {
  const response = await axios.get(`${process.env.MIX_API_SLUG}/track/${id}`)
  for (const field of Object.keys(response.data)) {
    form.value[field] = response.data[field]
  }
}

function onPartialsFileInput (eventTarget) {
  form.value['partials_file_name'] = eventTarget.value.split('\\').reverse()[0]
  form.value['sourcefile'] = eventTarget.files[0]
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
    form.value['is_choir'] = validationResult.isChoir
    detectedLanguages.value = validationResult.detectedLanguages
  }

  form.value['tts_instructions_file_name'] = eventTarget.value.split('\\').reverse()[0]
  form.value['tts_instructions'] = file
}

function submit () {
  // TODO: Do formatting somewhere else (during v-model?)
  // Oruga datetimepicker has a datetimeFormatter prop, maybe this helps https://oruga.io/components/datetimepicker.html
  const formattedForm = {}
  for (const field of Object.keys(form.value)) {
    formattedForm[field] = form.value[field]
  }

  formattedForm['ttsLanguages'] = detectedLanguages.value

  if (path.type === 'add') {
    useForm(formattedForm).post(`${process.env.MIX_API_SLUG}/track/create`)
  } else if (path.type === 'edit') {
    useForm(formattedForm).post(`${process.env.MIX_API_SLUG}/track/edit/${id}`)
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
</script>

<template>
  <div>

    <Head :title="title" />

    <BreezeAuthenticatedLayout>
      <template #header>
        <div class="flex gap-2 text-white">
          <h2 class="uppercase font-semibold font-mono text-xl leading-tight text-center">
            {{ title }}
          </h2>
          <div v-if="path.type === 'edit'"
               class="flex gap-2 text-sm items-center">
            <p>Created at: {{ form.created_at }}</p>
            <p>Last updated at: {{ form.updated_at }}</p>
          </div>
        </div>
      </template>
      <div v-if="loadingFinished"
           class="flex flex-col items-center mt-2 px-2 py-8 bg-white border border-gray-200 shadow md:px-6 md:justify-center">
        <form @submit.prevent="submit"
              class="inline-block w-full md:w-1/2">

          <div class="mb-2">
            <label>Track title</label>
            <o-input type="text"
                     v-model="form.title" />
          </div>

          <div class="mb-2">
            <label>Track description</label>
            <o-input type="text"
                     v-model="form.description" />
          </div>

          <div class="mb-2">
            <label>Partial file<span v-if="path.type === 'edit'">: {{ form.partials_file_name }}</span></label>
            <PartialsUpload @fileInput="onPartialsFileInput" />
          </div>

          <div class="mb-2">
            <label>TTS file<span v-if="path.type === 'edit'">: {{ form.tts_instructions_file_name }}</span></label>
            <div class="flex
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
              <div v-if="detectedLanguages"
                   class="mt-4">
                Detected languages: {{ detectedLanguages.join(', ') }}<br>
                Type: {{ form['is_choir'] ? 'Choir' : 'Non-choir' }}
              </div>
            </div>
          </div>

          <div class="flex justify-center mt-2">
            <button>
              <o-button>Submit</o-button>
            </button>
          </div>
        </form>
      </div>
      <div v-else>
        <span>Loading...</span>
      </div>
    </BreezeAuthenticatedLayout>
  </div>
</template>

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
