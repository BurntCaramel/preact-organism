module.exports = {
  type: 'web-module',
  npm: {
    esModules: true,
    umd: {
      global: 'PreactOrganism',
      externals: {}
    }
  },
  babel: {
    presets: ['preact']
  },
  karma: {
    browsers: ['ChromeHeadless']
  }
}
