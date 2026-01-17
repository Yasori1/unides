import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.services';

/**
 * Global Error Interceptor
 * Catches HTTP errors and displays user-friendly toast notifications
 * NOT: 401 errors are handled by auth.interceptor for token refresh
 * This interceptor only shows user-friendly messages
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip error handling for certain endpoints (e.g., public endpoints that might return 404)
      // Ayrıca email validation için kullanılan endpoint'ler için toast gösterilmemeli
      // çünkü component'te zaten mesaj gösteriliyor
      const skipErrorHandling = req.url.includes('/api/Search') || 
                                req.url.includes('/api/About') ||
                                req.url.includes('/api/Forkod') ||
                                (req.url.includes('/api/Communities/me/members') && req.method === 'POST') || // Email check ve 409 conflict için
                                (req.url.includes('/api/Communities/me/memberships') && error.status === 403); // Membership 403 hatalarını suppress et

      if (skipErrorHandling) {
        return throwError(() => error);
      }

      let errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      let shouldShowToast = true;

      // Handle different error types
      if (error.status === 0) {
        // Network error or CORS issue
        errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
        // Network hatalarında logout yapma - auth.interceptor zaten handle ediyor
      } else if (error.status === 401) {
        // Unauthorized - token expired or invalid
        // auth.interceptor zaten token refresh denedi ve başarısız oldu
        // Sadece mesaj göster, logout'u auth.interceptor halletti
        errorMessage = 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.';
        shouldShowToast = false; // auth.interceptor zaten yönlendirme yaptı
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
      if (typeof window !== 'undefined' && shouldShowToast) {
        toastService.show(errorMessage, 'error');
      }

      // Log error for debugging (only in development)
      if (!error.url?.includes('/api/Search')) {
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
