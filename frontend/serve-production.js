const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy API calls to backend
app.use('/deliveries', createProxyMiddleware({
  target: 'http://localhost:4000',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Backend unavailable' });
  }
}));

app.use('/health', createProxyMiddleware({
  target: 'http://localhost:4000',
  changeOrigin: true,
  onError: (err, req, res) => {
    res.status(500).json({ status: 'down' });
  }
}));

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on http://localhost:${PORT}`);
  console.log(`Network access available for mobile devices`);
});