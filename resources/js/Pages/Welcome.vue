<template>

    <Head title="" />
    <div class="pt-16 flex flex-col items-center justify-center w-full absolute z-50 top-6 left-0 text-white">
        <ApplicationLogo />
        <div class="mt-16 p-4 flex flex-col items-center font-mono bg-gray-900">
            This is the SADISS API.<br>Find more information here:
            <a class="p-2" target="_blank" href="https://sadiss.net">Web</a>
            <a class="p-2" target="_blank" href="https://github.com/wildyeast/sadiss">Github</a>
        </div>
    </div>

    <div
        class="relative flex items-top justify-center min-h-screen bg-primary sm:items-center sm:pt-0">
        <div v-if="canLogin" class="hidden fixed top-0 right-0 px-6 py-4 sm:block">
            <Link :href="route('login')" class="text-sm text-white underline">
            Log in
            </Link>

            <Link v-if="canRegister" :href="route('register')" class="ml-4 text-sm text-white underline">
            Register
            </Link>
        </div>
    </div>
</template>
<script setup>
import ApplicationLogo from '@/Components/ApplicationLogo.vue'
import { Head, Link } from '@inertiajs/inertia-vue3';
import { ref } from 'vue'

const props = defineProps({
    canLogin: Boolean,
    canRegister: Boolean,
    laravelVersion: String,
    phpVersion: String,
})

</script>

<style scoped>
.bg-gray-100 {
    background-color: #f7fafc;
    background-color: rgba(247, 250, 252, var(--tw-bg-opacity));
}

.border-gray-200 {
    border-color: #edf2f7;
    border-color: rgba(237, 242, 247, var(--tw-border-opacity));
}

.text-gray-400 {
    color: #cbd5e0;
    color: rgba(203, 213, 224, var(--tw-text-opacity));
}

.text-gray-500 {
    color: #a0aec0;
    color: rgba(160, 174, 192, var(--tw-text-opacity));
}

.text-gray-600 {
    color: #718096;
    color: rgba(113, 128, 150, var(--tw-text-opacity));
}

.text-gray-700 {
    color: #4a5568;
    color: rgba(74, 85, 104, var(--tw-text-opacity));
}

.text-gray-900 {
    color: #1a202c;
    color: rgba(26, 32, 44, var(--tw-text-opacity));
}

@media (prefers-color-scheme: dark) {
    .dark\:bg-gray-800 {
        background-color: #2d3748;
        background-color: rgba(45, 55, 72, var(--tw-bg-opacity));
    }

    .dark\:bg-gray-900 {
        background-color: #1a202c;
        background-color: rgba(26, 32, 44, var(--tw-bg-opacity));
    }

    .dark\:border-gray-700 {
        border-color: #4a5568;
        border-color: rgba(74, 85, 104, var(--tw-border-opacity));
    }

    .dark\:text-white {
        color: #fff;
        color: rgba(255, 255, 255, var(--tw-text-opacity));
    }

    .dark\:text-gray-400 {
        color: #cbd5e0;
        color: rgba(203, 213, 224, var(--tw-text-opacity));
    }
}
</style>
