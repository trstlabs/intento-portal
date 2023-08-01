const nodeExternals = require('webpack-node-externals')

module.exports = {
  externals: [nodeExternals()],
  resolve: {
    extensions: ['.ts', 'query.ts']
  }
}
