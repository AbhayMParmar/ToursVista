const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Primary server from your error logs
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://toursvista.onrender.com',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api',
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add CORS headers
        proxyReq.setHeader('Origin', 'http://localhost:3000');
      },
      onProxyRes: (proxyRes, req, res) => {
        // Ensure CORS headers are present
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      }
    })
  );

  // Fallback server configuration
  app.use(
    '/api-alt',
    createProxyMiddleware({
      target: 'https://tours-travels-server-6mm7.onrender.com',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api-alt': '/api',
      },
    })
  );
};
