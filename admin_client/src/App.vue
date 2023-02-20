<template>
  <nav v-if="false">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav>
  <div class="flex flex-col justify-center items-center">
    <div class="flex flex-col mt-8">
      <img src="https://sadiss.net/wp-content/uploads/2022/07/Sadiss-Logo.png" class="w-auto h-16">
      Performer's Interface
    </div>
    <router-view/>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #faf1f1;
}

html {
  background-color: #3e5b53;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}

input {
  border: 1px solid lightgrey;
}
</style>
