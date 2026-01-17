export const environment = {
  production: false,
  // Kendi bilgisayarında 'ng serve' yaparken burası çalışır
  // Proxy kullanıyorsanız: http://localhost:4200/api (proxy.conf.json üzerinden backend'e yönlendirilir)
  // Proxy kullanmıyorsanız ve backend localhost'ta çalışıyorsa: http://localhost:5000/api veya http://localhost:7001/api
  // Remote sunucu kullanmak istiyorsanız: http://72.62.37.160:8080/api
  apiUrl: 'https://unidesportal.com/api', // Proxy üzerinden çalışır (proxy.conf.json ile backend'e yönlendirilir)
  // Flask Chatbot API URL - Development
  chatbotApiUrl: 'https://unidesportal.com/chatbot', // Chatbot sunucu URL'si
  // Spam Bot API URL - Development
  spamBotApiUrl: 'https://unidesportal.com/spam-check', // Spam kontrol sunucu URL'si
};
