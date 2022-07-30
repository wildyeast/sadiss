const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.vue',
    ],

    theme: {
        extend: {
            borderWidth: {
                '1': '1px',
            },
            colors: {
                'bulma-input-border': '#dbdbdb',
                'bulma-input-border-hover': '#b5b5b5',
                'primary': '#3e5b53'
            },
            fontFamily: {
                sans: ['Nunito', ...defaultTheme.fontFamily.sans],
            },
        },
        borderRadius: {
          'bulma-input-border-radius': '4px',
        },
    },

    plugins: [require('@tailwindcss/forms')],
};
