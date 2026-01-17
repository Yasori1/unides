import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.services';
import { environment } from '../../environments/environment';

/**
 * Global Error Interceptor
 * Catches HTTP errors and displays user-friendly toast notifications
 * Security Note: Error messages are sanitized to prevent information disclosure
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
        (req.url.includes('/api/Communities/me/members') && req.method === 'POST');

      if (skipErrorHandling) {
        return throwError(() => error);
      }

      // Generic user-friendly error messages - no backend details exposed
      let errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.';

      // Handle different error types with sanitized messages
      if (error.status === 0) {
        // Network error or CORS issue
        errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
      } else if (error.status === 401) {
        // Unauthorized - token expired or invalid
        errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          localStorage.removeItem('user_type');
        }
      } else if (error.status === 403) {
        // Forbidden - don't expose why access was denied
        errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
      } else if (error.status === 404) {
        // Not Found - generic message, no endpoint details
        errorMessage = 'İstenen kaynak bulunamadı.';
      } else if (error.status === 429) {
        // Too Many Requests
        errorMessage = 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.';
      } else if (error.status >= 400 && error.status < 500) {
        // Client errors (400-499) - use backend message only if safe
        const backendMessage = error.error?.message || error.error?.error;
        // Only use backend message if it's a user-input related error
        if (backendMessage && isSafeErrorMessage(backendMessage)) {
          errorMessage = backendMessage;
        } else {
          errorMessage = 'İstek geçersiz. Lütfen bilgilerinizi kontrol edin.';
        }
      } else if (error.status >= 500) {
        // Server errors (500+) - never expose server details
        errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      }

      // Show toast notification
      if (typeof window !== 'undefined') {
        toastService.show(errorMessage, 'error');
      }

      // Log error for debugging (only in development)
      if (!environment.production) {
        console.error('HTTP Error:', {
          url: error.url,
          status: error.status,
          message: errorMessage,
        });
      }

      // Re-throw the error so components can still handle it if needed
      return throwError(() => error);
    })
  );
};

/**
 * Check if an error message is safe to show to users
 * Filters out messages that might expose implementation details
 */
function isSafeErrorMessage(message: string): boolean {
  if (!message || typeof message !== 'string') {
    return false;
  }

  // List of patterns that indicate unsafe/technical error messages
  const unsafePatterns = [
    /backend/i,
    /server/i,
    /database/i,
    /sql/i,
    /exception/i,
    /stack\s*trace/i,
    /null\s*reference/i,
    /endpoint/i,
    /api\//i,
    /internal/i,
    /\.cs$/i,
    /\.dll/i,
    /asp\.net/i,
    /microsoft/i,
    /connection\s*string/i,
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
  ];

  // Check if message contains any unsafe patterns
  for (const pattern of unsafePatterns) {
    if (pattern.test(message)) {
      return false;
    }
  }

  // Message length check - very long messages are likely stack traces
  if (message.length > 200) {
    return false;
  }

  return true;
}
