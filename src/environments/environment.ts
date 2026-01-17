export const environment = {
  production: false,
  // ✅ DEVELOPMENT: Direkt https://unidesportal.com/api'ye bağlanır (proxy kullanılmaz)
  // CORS ayarları backend'de yapılmış olmalı
  apiUrl: 'https://unidesportal.com/api',
  // Image Base URL - Backend'den gelen image path'leri bu URL ile birleştirilir
  imageBaseUrl: 'https://unidesportal.com',
  // Chatbot API URL - Development
  chatbotApiUrl: 'https://unidesportal.com/chatbot',
  // Spam Bot API URL - Development
  spamBotApiUrl: 'https://unidesportal.com/spam-check',
};
