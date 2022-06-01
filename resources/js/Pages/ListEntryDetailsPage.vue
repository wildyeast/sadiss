<script setup>
import BreezeAuthenticatedLayout from '@/Layouts/Authenticated.vue'
import { Head, useForm, Link } from '@inertiajs/inertia-vue3'
import { onMounted, reactive, toRefs, ref } from 'vue'
import QrcodeVue from 'qrcode.vue'
import Player from '@/Components/Player.vue'
import ClientList from '@/Components/ClientList.vue'
import TrackList from '@/Components/Tracklist.vue'

const pathname = window.location.pathname.replace('/', '')
const category = pathname.split('/')[0]
let routeCategory = ''
const id = pathname.split('/')[1]
const data = reactive({})
const selectedTrack = ref()
const showPerformanceQRCode = ref(false)

onMounted(async () => {
  // TODO: This switch is identical to the one in ListPage.vue. Find a smart way to handle this.
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
  const response = await axios.get(`/api/${routeCategory}/${id}`);
  for (const entry of Object.keys(response.data)) {
    data[entry] = response.data[entry]
  }
})

const trackSelected = (track) => {
  selectedTrack.value = track
  console.log("Selected track: ", track)
}

</script>

<template>
    <div>
        <Head title="Details" />

        <BreezeAuthenticatedLayout>
            <template #header>
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Details
                </h2>
            </template>

            <div v-if="Object.keys(data).length > 0" class="w-100 mt-2 py-8 bg-white border border-gray-200 shadow md:px-6 md:justify-center">
              <div class="flex flex-col max-w-7xl mx-auto px-4">
                <div class="flex justify-between">
                  <div class="flex mb-4 text-slate-400 text-xs">
                    <div class="flex flex-col mr-4">
                      <span>Id: </span>
                      <span>Created at:</span>
                      <span>Updated at:</span>
                    </div>
                    <div class="flex flex-col">
                      <span>{{ data['id'] }}</span>
                      <span>{{ data['created_at'] }}</span>
                      <span>{{ data['updated_at'] }}</span>
                    </div>
                  </div>
                  <Link :href="route(`${category}.edit`, {id: id})">
                    <span class="material-icons mi-edit text-blue-500" />
                  </Link>
                </div>
                <!-- Track -->
                <template v-if="category === 'tracks'">
                  <div class="flex mb-4">
                    <!-- Left hand side -->
                    <div class="flex-1">
                      <p class="mb-4 text-2xl">{{ data['title'] }}</p>
                      <p class="text-justify">{{ data['description'] }}</p>
                    </div>
                    <!-- Right hand side -->
                    <div class="flex-1 flex flex-col items-center">
                      <p>Play track on this device</p>
                      <Player :partialData="data['partials']"/>
                    </div>
                  </div>
                  <!-- Below -->
                  <div>
                    <ClientList :trackId="id" :ttsInstructions="JSON.parse(data['tts_instructions'])" />
                  </div>
                </template>
                <!-- Composer -->
                <template v-if="category === 'composers'">
                  <div class="flex">
                    <!-- Left hand side -->
                    <div class="flex-1">
                      <div class="flex justify-between items-center mb-4">
                        <p class="text-2xl">{{ data['name'] }}</p>
                        <p v-if="data['is_active']" class="text-green-700" >Active</p>
                        <p v-else class="text-rose-500">Inactive</p>
                      </div>
                      <p class="text-justify">{{ data['description'] }}</p>
                    </div>
                    <!-- Right hand side -->
                    <div class="flex-1 flex flex-col items-center">
                      <img :src="data['photo']" alt="An image of the composer." class="w-1/2 mb-4">
                      <div class="flex flex-col items-center w-1/2 border border-bulma-input-border rounded-bulma-input-border-radius">
                        <p class="py-4 border-b border-bulma-input-border">Website</p>
                        <a :href="data['website_url']" class="py-4 text-center">{{ data['website_url'] }}</a>
                      </div>
                    </div>
                  </div>
                </template>
                <!-- Performance -->
                <template v-if="category === 'performances'">
                  <div class="w-full">
                    <div class="flex justify-between items-center mb-4">
                      <p class="text-2xl">{{ data['location'] }}</p>
                      <p v-if="data['is_active']" class="text-green-700" >Active</p>
                      <p v-else class="text-rose-500">Inactive</p>
                    </div>
                    <button @click="showPerformanceQRCode = true">Generate QR-Code for this performance</button>
                    <qrcode-vue v-if="showPerformanceQRCode" :value="`http://sadiss.net/client?id=${id}`" :size="300" level="H" />
                    <div class="flex">
                      <div class="mr-4">
                        <p>Start time:</p>
                        <p>End time:</p>
                      </div>
                      <div>
                        <p>{{ data['start_time'] }}</p>
                        <p>{{ data['end_time'] }}</p>
                      </div>
                    </div>
                    <TrackList :performance="data" @trackSelected="trackSelected" />
                    <ClientList v-if="selectedTrack"
                      :trackId="selectedTrack.id"
                      :performanceId="id"
                      :ttsInstructions="JSON.parse(selectedTrack.tts_instructions)" />
                  </div>
                </template>
              </div>
            </div>
        </BreezeAuthenticatedLayout>
    </div>
</template>
