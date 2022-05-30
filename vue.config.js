const webpack = require('webpack')

module.exports = {
    // options...
    devServer: {
        allowedHosts: "all"
    },
    configureWebpack: {
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
                process: 'process/browser'
            })
        ],
        resolve: {
            fallback: {
                "buffer": require.resolve("buffer/"),
                "stream": require.resolve("stream-browserify"),
                "crypto": require.resolve("crypto-browserify")
            }
        }
    }
}