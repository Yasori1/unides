export const environment = {
  production: true,
  // ✅ PRODUCTION: Direkt https://unidesportal.com/api'ye bağlanır
  // Build alındığında bu URL kullanılır, proxy kullanılmaz
  apiUrl: 'https://unidesportal.com/api',
  // Image Base URL - Backend'den gelen image path'leri bu URL ile birleştirilir
  imageBaseUrl: 'https://unidesportal.com',
  // Chatbot API URL - Production
  chatbotApiUrl: 'https://unidesportal.com/chatbot',
  // Spam Bot API URL - Production
  spamBotApiUrl: 'https://unidesportal.com/spam-check',
};
