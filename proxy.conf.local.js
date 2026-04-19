// Yerel geliştirme proxy yapılandırması
// Backend API'yi kendi bilgisayarında çalıştırırken kullan: npm run start:local
//
// ⚠️  DEĞİŞTİRMEN GEREKEN YER:
//     LOCAL_API_PORT → .NET API'nin dinlediği port ile aynı olmalı.
//     Bu repoda: Unides.API.New/Unides.WebAPI/Properties/launchSettings.json
//     → "http" profili: applicationUrl "http://localhost:5199" → port 5199.
//     API'yi farklı profille (ör. sadece 7069) çalıştırıyorsan bu portu ona göre güncelle.
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