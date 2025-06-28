export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    }
  },

  resolve: {
  alias: {
    'three': path.resolve(__dirname, 'node_modules/three')
  }
}
}