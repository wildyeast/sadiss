<template>
  <main>
    <div class="sticky top-0 text-center">
      <h1>Dashboard</h1>
    </div>
    <div class="flex items-center gap-4 px-2 pt-12 lg:flex-col">
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
