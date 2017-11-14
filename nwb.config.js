module.exports = {
  type: 'web-module',
  npm: {
    esModules: true,
    umd: {
      global: 'PreactOrganism',
      externals: {
        'preact': 'preact'
      }
    }
  },
  babel: {
    presets: ['preact']
  },
  karma: {
    browsers: ['ChromeHeadless']
  }
}
