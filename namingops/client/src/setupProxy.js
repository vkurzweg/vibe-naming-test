const { createProxyMiddleware } = require('http-proxy-middleware');

console.log('setupProxy.js is being loaded!');

const isDevOrDemo =
  process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ||
  process.env.REACT_APP_DEMO_MODE === 'true';

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      // No pathRewrite: keep /api/v1/... as-is
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
      },
      onProxyReq: (proxyReq, req, res) => {
        if (isDevOrDemo) {
          console.log('Proxying request:', req.method, req.path);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        if (isDevOrDemo) {
          proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
          proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        }
      }
    })
  );
};