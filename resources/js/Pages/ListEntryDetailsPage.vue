<template>
    <div>
        <Head title="Dashboard" />

        <BreezeAuthenticatedLayout>
            <template #header>
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Dashboard
                </h2>
            </template>

            <div class="py-12">
                <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <form @submit.prevent="submit">
                        <div class="p-6 bg-white border-b border-gray-200 flex flex-col">
                        <label class="pb-6" for="sourcefile">
                            Upload a SPEAR partials file
                        </label>
                            <input
                            type="file"
                            accept=".txt"
                            @input="form.sourcefile = $event.target.files[0]" />
                                <progress
                                v-if="form.progress"
                                :value="form.progress.percentage"
                                max="100">
                                {{ form.progress.percentage }}%
                                </progress>
                        <Button>Submit</Button>
                        </div>
                    </form>
                    </div>
                </div>
            </div>
        </BreezeAuthenticatedLayout>
    </div>
</template>

<script>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head, useForm } from '@inertiajs/inertia-vue3'

export default {
  components: {
    BreezeAuthenticatedLayout,
    Head,
  },
  setup () {
    const form = useForm({
      name: null,
      sourcefile: null,
      title: 'title',
      description: 'desc'
    })
    function submit() {
      form.post('/api/track/create')
    }
    return { form, submit }
  }
}
</script>
