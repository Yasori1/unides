export const environment = {
  production: false,
  // Development'ta proxy kullanılıyor: /api istekleri proxy.conf.json üzerinden https://unidesportal.com'a yönlendirilir
  // Bu sayede CORS sorunu olmaz çünkü browser localhost:4200/api görür, proxy arka planda https://unidesportal.com/api'ye yönlendirir
  apiUrl: '/api', // Proxy üzerinden çalışır (proxy.conf.json ile https://unidesportal.com'a yönlendirilir)
  // Flask Chatbot API URL - Development (proxy kullanılmıyor, direkt istek)
  chatbotApiUrl: 'https://unidesportal.com/chatbot/chat', // Chatbot sunucu URL'si
  // Spam Bot API URL - Development (proxy kullanılmıyor, direkt istek)
  spamBotApiUrl: 'https://unidesportal.com/spamfilter/api/moderate', // Spam kontrol sunucu URL'si
};
