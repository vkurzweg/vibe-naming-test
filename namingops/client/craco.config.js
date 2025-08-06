const path = require('path');

module.exports = {
  babel: {
    loaderOptions: {
      babelrc: true,
      configFile: path.resolve(__dirname, 'babel.config.js')
    }
  },
  devServer: (devServerConfig) => {
    return {
      ...devServerConfig,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          logLevel: 'debug',
          onProxyReq: (proxyReq) => {
            console.log('Proxying request to:', proxyReq.path);
          }
        }
      }
    };
  },
  webpack: {
    configure: (webpackConfig) => {
      // Remove ModuleScopePlugin which prevents importing from outside src/
      const scopePluginIndex = webpackConfig.resolve.plugins.findIndex(
        ({ constructor }) => constructor && constructor.name === 'ModuleScopePlugin'
      );
      
      if (scopePluginIndex > -1) {
        webpackConfig.resolve.plugins.splice(scopePluginIndex, 1);
      }
      
      // Add support for ESM modules
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });

      // Add fallback for process
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        'process': require.resolve('process/browser')
      };
      
      return webpackConfig;
    }
  },
};