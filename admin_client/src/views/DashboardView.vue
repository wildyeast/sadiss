<template>
  <main>
    <h1 class="text-center text-3xl font-bold">Dashboard</h1>
    <div class="mt-6 flex items-center gap-4 px-2">
      <router-link
        to="/performances"
        class="w-1/2 border p-6 text-center text-lg"
        >Performances
      </router-link>
      <router-link
        to="/tracks"
        class="w-1/2 border p-6 text-center text-lg"
        >Tracks
      </router-link>
    </div>
  </main>
</template>
