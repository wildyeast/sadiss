<template>
    <Head title="" />
      <div class="phone absolute z-50 top-0 left-0 bg-gray-100 dark:bg-gray-900 text-white">
        <pre style="background: none" class="text-white">
   _______   ___  ____________
  / __/ _ | / _ \/  _/ __/ __/
 _\ \/ __ |/ // // /_\ \_\ \  
/___/_/ |_/____/___/___/___/  
               
This site is under construction.
        </pre>
      </div>

    <div class="relative flex items-top justify-center min-h-screen bg-gray-100 dark:bg-gray-900 sm:items-center sm:pt-0">
        <div v-if="canLogin" class="hidden fixed top-0 right-0 px-6 py-4 sm:block">
            <Link v-if="$page.props.auth.user" :href="route('dashboard')" class="text-sm text-gray-700 underline">
                Dashboard
            </Link>

            <template v-else>
                <Link :href="route('login')" class="text-sm text-gray-700 underline">
                    Log in
                </Link>

                <Link v-if="canRegister" :href="route('register')" class="ml-4 text-sm text-gray-700 underline">
                    Register
                </Link>
            </template>
        </div>


        <div class="desktop max-w-6xl mx-auto sm:px-6 lg:px-8 text-white">
          <pre style="background: none" class="text-white">
_____/\\\\\\\\\\\_______/\\\\\\\\\_____/\\\\\\\\\\\\_____/\\\\\\\\\\\_____/\\\\\\\\\\\_______/\\\\\\\\\\\___        
 ___/\\\/////////\\\___/\\\\\\\\\\\\\__\/\\\////////\\\__\/////\\\///____/\\\/////////\\\___/\\\/////////\\\_       
  __\//\\\______\///___/\\\/////////\\\_\/\\\______\//\\\_____\/\\\______\//\\\______\///___\//\\\______\///__      
   ___\////\\\_________\/\\\_______\/\\\_\/\\\_______\/\\\_____\/\\\_______\////\\\___________\////\\\_________     
    ______\////\\\______\/\\\\\\\\\\\\\\\_\/\\\_______\/\\\_____\/\\\__________\////\\\___________\////\\\______    
     _________\////\\\___\/\\\/////////\\\_\/\\\_______\/\\\_____\/\\\_____________\////\\\___________\////\\\___   
      __/\\\______\//\\\__\/\\\_______\/\\\_\/\\\_______/\\\______\/\\\______/\\\______\//\\\___/\\\______\//\\\__  
       _\///\\\\\\\\\\\/___\/\\\_______\/\\\_\/\\\\\\\\\\\\/____/\\\\\\\\\\\_\///\\\\\\\\\\\/___\///\\\\\\\\\\\/___ 
        ___\///////////_____\///________\///__\////////////_____\///////////____\///////////_______\///////////_____

          This site is under construction.
          </pre>
        </div>
    </div>
</template>
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

<script>
import { Head, Link } from '@inertiajs/inertia-vue3';

export default {
    components: {
      Head,
      Link,
    },
    props: {
        canLogin: Boolean,
        canRegister: Boolean,
        laravelVersion: String,
        phpVersion: String,
    },
}
</script>
<style>
.phone {
  visibility: visible;
}
.desktop {
  visibility: hidden;
}
@media (min-width: 1023px) {
  .phone {
    visibility: hidden;
  }
  .desktop {
    visibility: visible;
  }
}
</style>
