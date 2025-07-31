module.exports = {
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
      configure: {
        module: {
          rules: [
            {
              test: /\.m?js$/,
              resolve: {
                fullySpecified: false,
              },
            },
          ],
        },
      },
    },
  };