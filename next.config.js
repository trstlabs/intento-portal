const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withBundleJunoblocks = require('next-bundle-junoblocks')

const config = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true, // Keep source maps for better debugging
  images: {
      domains: ['intento.zone'], // Add the external domain here
  },

  webpack(config, { webpack }) {
    // // config.optimization.splitChunks = {
    // //   cacheGroups: {
    // //     default: false,
    // //   },
    // // };
    // config.optimization.runtimeChunk = false;
    // // config.output.filename = 'static/chunks/[name].js';
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    )

    if (!config.resolve.fallback) {
      config.resolve.fallback = {}
    }

    Object.assign(config.resolve.fallback, {
      buffer: false,
      crypto: false,
      events: false,
      path: false,
      stream: false,
      string_decoder: false,
    })

    return config
  },
}

module.exports = withBundleAnalyzer(
  process.env.BUNDLE_INTOBLOCKS === 'true'
    ? withBundleJunoblocks(config)
    : config
    
)
