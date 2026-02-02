export const environment = {
  production: false,
  // Development'ta proxy kullanılıyor: /api istekleri proxy.conf.json üzerinden https://unidesportal.org'a yönlendirilir
  apiUrl: '/api', // Proxy üzerinden çalışır (proxy.conf.json ile https://unidesportal.org/api'ye yönlendirilir)
  // Flask Chatbot API URL - Development
  chatbotApiUrl: 'https://unidesportal.org/chatbot/chat', // Chatbot sunucu URL'si
  // Spam Bot API URL - Development
  spamBotApiUrl: 'https://unidesportal.org/spamfilter/api/moderate', // Spam kontrol sunucu URL'si
};
