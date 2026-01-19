import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from './services/auth.services';
import { errorInterceptor } from './interceptors/error.interceptor';

/**
 * Auth Interceptor
 * Automatically attaches Authorization Bearer token to all HTTP requests
 * Handles FormData requests correctly (doesn't set Content-Type for multipart)
 */
const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // FormData mı kontrol et - FormData ise Content-Type eklememeliyiz
  // Browser otomatik olarak multipart/form-data boundary ekler
  const isFormData = req.body instanceof FormData;

  // Header'ları hazırla
  const headers: { [key: string]: string } = {};

  // Sadece FormData DEĞİLSE Content-Type ekle
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }

  // Eğer token varsa, Authorization header'ını ekle
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
    // Interceptors are applied in order: authInterceptor first, then errorInterceptor
    // Direct connection to unidesportal.com/api - no proxy
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'tr' },
  ],
};
