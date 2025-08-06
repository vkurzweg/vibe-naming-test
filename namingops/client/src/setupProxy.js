const { createProxyMiddleware } = require('http-proxy-middleware');

console.log('setupProxy.js is being loaded!');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      pathRewrite: (path, req) => path, // keep entire path including /api prefix
      target: 'http://localhost:5000', // Your backend server URL
      changeOrigin: true,
      secure: false,
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
      },
      onProxyReq: (proxyReq, req, res) => {
        // Log the proxied request in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Proxying request:', req.method, req.path);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers in development
        if (process.env.NODE_ENV === 'development') {
          proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
          proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        }
      }
    })
  );
};
