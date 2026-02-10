export const environment = {
  production: false,
  apiUrl: '/api',
  chatbotApiUrl: '/chatbot/chat',
  spamBotApiUrl: '/api/moderate',
  /** Görsel path'leri tam URL yapmak için base (Banner/Logo: https://unidesportal.org/ImagesUnides/...) */
  imageBaseUrl: 'https://unidesportal.org',
  // Tüm istekler proxy üzerinden https://unidesportal.org'a gider (proxy.conf.json / proxy.conf.js)
};
