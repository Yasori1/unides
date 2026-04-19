// Yerel geliştirme proxy yapılandırması
// Backend API'yi kendi bilgisayarında çalıştırırken kullan: npm run start:local
//
// ⚠️  DEĞİŞTİRMEN GEREKEN YER:
//     LOCAL_API_PORT → .NET API'nin çalıştığı port numarasını yaz
//     (Backend ekibinden öğren, genellikle 5000, 5001, 7000 veya 7001)
//
// Bu dosya .gitignore'da olduğu için her geliştirici kendi portunu ayarlayabilir.

const LOCAL_API_PORT = 5199; // ← BURAYA KENDİ PORT'UNU YAZ

const LOCAL_BASE = `http://localhost:${LOCAL_API_PORT}`;

const PROXY_CONFIG = {
  '/api/moderate': {
    target: LOCAL_BASE,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
  },
  '/chatbot': {
    target: LOCAL_BASE,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
  },
  '/api': {
    target: LOCAL_BASE,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    ws: true,
  },
  '/spam-check': {
    target: LOCAL_BASE,
    secure: false,
    changeOrigin: true,
    logLevel: 'warn',
    rewrite: (path) => path.replace(/^\/spam-check/, '/api/moderate'),
  },
  '/ImagesUnides': {
    target: LOCAL_BASE,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
  },
};

module.exports = PROXY_CONFIG;