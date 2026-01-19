import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.services';

/**
 * Global Error Interceptor
 * Catches HTTP errors and displays user-friendly toast notifications
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip error handling for certain endpoints (e.g., public endpoints that might return 404)
      // Ayrıca email validation için kullanılan endpoint'ler için toast gösterilmemeli
      // çünkü component'te zaten mesaj gösteriliyor
      // Event detail re-fetch için kullanılan endpoint'ler için de 404'leri sessizce handle et
      const isEventDetailReFetch = req.url.match(/\/api\/Events\/\d+$/) && error.status === 404;
      const skipErrorHandling = req.url.includes('/api/Search') || 
                                req.url.includes('/api/About') ||
                                req.url.includes('/api/Forkod') ||
                                (req.url.includes('/api/Communities/me/members') && req.method === 'POST') ||
                                isEventDetailReFetch; // Event detail re-fetch için 404'leri sessizce handle et

      if (skipErrorHandling) {
        // Event detail re-fetch için 404'leri tamamen sessizce handle et (toast ve log yok)
        return throwError(() => error);
      }

      let errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.';

      // Handle different error types
      if (error.status === 0) {
        // Network error, CORS issue, or SSL certificate error
        // Check if it's an SSL certificate error
        const errorMessageStr = error.message || '';
        const errorUrl = error.url || '';
        const isSSLError = errorMessageStr.includes('ERR_CERT') || 
                          errorMessageStr.includes('certificate') ||
                          errorMessageStr.includes('SSL') ||
                          errorMessageStr.includes('TLS') ||
                          (errorUrl && errorUrl.includes('https://unidesportal.com'));
        
        if (isSSLError) {
          errorMessage = 'SSL sertifika hatası. Sunucu sertifikası geçersiz veya güvenilir değil. Lütfen sunucu yöneticisiyle iletişime geçin.';
        } else {
          errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
        }
      } else if (error.status === 401) {
        // Unauthorized - token expired or invalid
        errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        // Optionally clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
        }
      } else if (error.status === 403) {
        // Forbidden
        errorMessage = error.error?.message || 'Bu işlem için yetkiniz bulunmamaktadır.';
      } else if (error.status === 404) {
        // Not Found - özel endpoint'ler için daha açıklayıcı mesajlar
        if (error.url?.includes('/Auth/update-profile')) {
          errorMessage = 'Profil güncelleme özelliği henüz aktif değil. Backend\'de endpoint oluşturulması gerekiyor.';
        } else {
          errorMessage = error.error?.message || 'İstenen kaynak bulunamadı.';
        }
      } else if (error.status === 500) {
        // Server Error
        errorMessage = error.error?.message || 
                      error.error?.error || 
                      'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      } else if (error.status >= 400 && error.status < 500) {
        // Client errors (400-499)
        errorMessage = error.error?.message || 
                      error.error?.error || 
                      'İstek geçersiz. Lütfen bilgilerinizi kontrol edin.';
      } else if (error.status >= 500) {
        // Server errors (500+)
        errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      }

      // Show toast notification
      if (typeof window !== 'undefined') {
        toastService.show(errorMessage, 'error');
      }

      // Log error for debugging (only in development and skip certain endpoints)
      // Event detail re-fetch için 404'leri loglama
      const shouldSkipLogging = error.url?.includes('/api/Search') || 
                                (error.url?.match(/\/api\/Events\/\d+$/) && error.status === 404);
      
      if (!shouldSkipLogging) {
        console.error('HTTP Error:', {
          url: error.url,
          status: error.status,
          message: errorMessage,
          error: error.error,
        });
      }

      // Re-throw the error so components can still handle it if needed
      return throwError(() => error);
    })
  );
};
