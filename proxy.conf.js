// Vite-compatible proxy configuration for Angular 21
// Proxy sayesinde CORS sorunu olmayacak - istekler localhost:4200'den gelecek
// IMPORTANT: Vite requires '**' wildcard for nested paths

// Tüm proxy hedefleri https://unidesportal.org
const PROXY_CONFIG = {
  '/api/moderate': {
    target: 'https://unidesportal.org',
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  '/chatbot': {
    target: 'https://unidesportal.org',
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  '/api': {
    target: 'https://unidesportal.org',
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    ws: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  '/spam-check': {
    target: 'https://unidesportal.org',
    secure: true,
    changeOrigin: true,
    logLevel: 'warn',
    rewrite: (path) => path.replace(/^\/spam-check/, '/api/moderate'),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  '/ImagesUnides': {
    target: 'https://unidesportal.org',
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
  },
};

module.exports = PROXY_CONFIG;
