const path = require('path');

module.exports = {
    resolve: {
        alias: {
            '@': path.resolve('resources/js'),
        },
    },
    output: {
        publicPath: "/api"
    },
    stats: {
        children: true
    },
};
