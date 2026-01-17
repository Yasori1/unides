import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
<<<<<<< Updated upstream

export const appConfig: ApplicationConfig = {
    providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(), provideAnimationsAsync()]
};
=======
import { AuthService } from './services/auth.services';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

/**
 * Content Type Interceptor
 * Handles FormData requests correctly (doesn't set Content-Type for multipart)
 */
const contentTypeInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // FormData mı kontrol et - FormData ise Content-Type eklememeliyiz
  // Browser otomatik olarak multipart/form-data boundary ekler
  const isFormData = req.body instanceof FormData;

  // Header'ları hazırla
  const headers: { [key: string]: string } = {};

  // Sadece FormData DEĞİLSE Content-Type ekle
  if (!isFormData && !req.headers.has('Content-Type')) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }

  const cloned = req.clone({
    setHeaders: headers,
  });

  return next(cloned);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideAnimationsAsync(),
    // Interceptors are applied in order:
    // 1. contentTypeInterceptor - Sets Content-Type header
    // 2. authInterceptor - Adds token & handles token refresh
    // 3. errorInterceptor - Shows error messages
    // NOTE: Ensure the remote server (72.62.37.160:8080) CORS policy allows 'http://localhost:4200' for development
    provideHttpClient(
      withFetch(), 
      withInterceptors([contentTypeInterceptor, authInterceptor, errorInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'tr' },
  ],
};
>>>>>>> Stashed changes
