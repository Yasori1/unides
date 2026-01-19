// Vite-compatible proxy configuration for Angular 21
// Proxy sayesinde CORS sorunu olmayacak - istekler localhost:4200'den gelecek
// IMPORTANT: Vite requires '**' wildcard for nested paths

const PROXY_CONFIG = {
  // Moderasyon API - daha spesifik pattern önce gelmeli (öncelikli)
  '/api/moderate': {
    target: 'http://72.62.37.160:5002',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  // Ana API - tüm /api/... istekleri için (nested paths dahil)
  // Vite'da nested path'ler için '**' wildcard pattern gerekli
  // Bu pattern /api/Events/upcoming/home gibi tüm nested path'leri yakalar
  '/api': {
    target: 'http://72.62.37.160:8080',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    ws: true,
    // Vite'da rewrite kullanmıyoruz, path'i olduğu gibi bırakıyoruz
    // Çünkü backend zaten /api/Events/upcoming/home formatını bekliyor
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  // Spam check API
  '/spam-check': {
    target: 'http://72.62.37.160:5002',
    secure: false,
    changeOrigin: true,
    logLevel: 'warn',
    rewrite: (path) => path.replace(/^\/spam-check/, '/check'),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  // Images proxy - CORS sorununu çözmek için
  '/ImagesUnides': {
    target: 'https://unidesportal.com',
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
  },
};

module.exports = PROXY_CONFIG;
