import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ToastService } from '../services/toast.services';
import { AuthService } from '../services/auth.services';

/**
 * Global Error Interceptor
 * Catches HTTP errors and displays user-friendly toast notifications
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip error handling for certain endpoints (e.g., public endpoints that might return 404)
      // Ayrıca email validation için kullanılan endpoint'ler için toast gösterilmemeli
      // çünkü component'te zaten mesaj gösteriliyor
      // Event detail re-fetch için kullanılan endpoint'ler için de 404'leri sessizce handle et
      // Logout endpoint'i için 401 hatası normal olabilir (token zaten geçersiz), döngüyü önlemek için skip et
      const isEventDetailReFetch = req.url.match(/\/api\/Events\/\d+$/) && error.status === 404;
      const isLogoutEndpoint = req.url.includes('/api/Auth/logout');
      const isSpamFilterEndpoint = req.url.includes('/spamfilter/api/moderate') || req.url.includes('/api/moderate');
      // Topluluk kaydı 3. adım: complete-community-setup bazen 401/400 "onay aşamasındadır" döner; component başarı ekranını gösterecek, logout/yönlendirme yapma
      const isCompleteCommunitySetup = req.url.includes('complete-community-setup');
      // Topluluk kaydı sonrası banner/logo yükleme: token yok (onay bekliyor), 401 gelir; logout yapma ve toast gösterme, component başarı sayfasını gösterir
      const isCommunityUploadAfterSetup =
        (req.url.includes('/Communities/') && (req.url.includes('/banner') || req.url.includes('/logo'))) &&
        error.status === 401;
      // Setup akışı: POST /api/Auth/community-setup/banner ve .../logo (X-Setup-Token); 401/403 gelirse logout yapma, component hata göstersin
      const isCommunitySetupUpload =
        req.url.includes('community-setup') && (req.url.includes('/banner') || req.url.includes('/logo'));
      // Topluluk girişi: silinmiş/reddedilmiş topluluk başkanı girişinde backend mesajı döner; community-login kendi uyarısını gösterecek (çakışma olmasın)
      const isAuthLogin = req.url.includes('/api/Auth/login') || req.url.includes('/Auth/login');
      const loginMsg =
        (error.error?.message || (error.error as any)?.Message || '').toString().toLowerCase();
      // Backend: RoleId 4 = reddedilmiş, RoleId 5 = silinmiş; bu kullanıcılar giriş yapamaz. community-login kendi mesajını gösterecek.
      const isCommunityRejectedOrDeleted =
        isAuthLogin &&
        (loginMsg.includes('silinmiştir') ||
          loginMsg.includes('silinmis') ||
          loginMsg.includes('reddedilmiştir') ||
          loginMsg.includes('reddedilmis') ||
          loginMsg.includes('önce reddedilmiş'));
      // Topluluk başkanı erişim kaldırıldı (403): community-dashboard kendi mesajını gösterir ve yönlendirir
      const isCommunityAccessRevoked =
        error.status === 403 &&
        (req.url.includes('/api/Communities/lead-by-me') ||
          req.url.includes('/Communities/leader-stats') ||
          (req.url.includes('/api/Communities/') && req.method === 'GET') ||
          (req.url.includes('/api/Events/') && req.url.includes('community')));
      const skipErrorHandling = req.url.includes('/api/Search') || 
                                req.url.includes('/api/About') ||
                                req.url.includes('/api/Forkod') ||
                                (req.url.includes('/api/Communities/me/members') && req.method === 'POST') ||
                                isEventDetailReFetch || // Event detail re-fetch için 404'leri sessizce handle et
                                isLogoutEndpoint || // Logout endpoint'i için hata handling'i skip et (döngüyü önlemek için)
                                isSpamFilterEndpoint || // Spam filter endpoint'i için hata handling'i skip et (component'te handle ediliyor)
                                (isCompleteCommunitySetup && (error.status === 401 || error.status === 400)) || // Topluluk kaydı başarılı sayılır, başarı sayfasına kalsın
                                isCommunityUploadAfterSetup || // Topluluk kaydı sonrası banner/logo 401: logout/toast yok, component başarı sayfasını gösterir
                                (isCommunitySetupUpload && (error.status === 401 || error.status === 403)) || // Setup upload 401/403: logout yapma, component hata göstersin
                                isCommunityRejectedOrDeleted || // Silinmiş/reddedilmiş topluluk girişi: community-login kendi mesajını gösterecek
                                isCommunityAccessRevoked; // 403 başkan erişim kaldırıldı: community-dashboard kendi mesajını gösterir

      if (skipErrorHandling) {
        // Event detail re-fetch için 404'leri tamamen sessizce handle et (toast ve log yok)
        // Logout endpoint'i için de hata handling'i skip et
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
                          (errorUrl && errorUrl.includes('https://unidesportal.org'));
        
        if (isSSLError) {
          errorMessage = 'SSL sertifika hatası. Sunucu sertifikası geçersiz veya güvenilir değil. Lütfen sunucu yöneticisiyle iletişime geçin.';
        } else {
          errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
        }
      } else if (error.status === 401) {
        // Unauthorized - access token expired veya geçersiz. Önce refresh dene; başarısızsa login'e düş.
        errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';

        const isRefreshRequest = req.url.includes('/Auth/refresh');
        const isCompleteCommunitySetupUrl = error.url?.includes('complete-community-setup');
        const isCommunityUploadUrl = error.url?.includes('/Communities/') && (error.url?.includes('/banner') || error.url?.includes('/logo'));
        const isCommunitySetupUploadUrl = error.url?.includes('community-setup') && (error.url?.includes('/banner') || error.url?.includes('/logo'));
        const isLogoutUrl = error.url?.includes('/api/Auth/logout');
        const skip401AndLogout = isLogoutUrl || isCompleteCommunitySetupUrl || isCommunityUploadUrl || isCommunitySetupUploadUrl;

        if (skip401AndLogout) {
          return throwError(() => error);
        }
        if (isRefreshRequest) {
          // Refresh endpoint hata döndü (token geçersiz/süresi dolmuş) — login'e yönlendir, toast göster
          if (typeof window !== 'undefined') authService.logout();
          if (typeof window !== 'undefined') toastService.show(errorMessage, 'error');
          return throwError(() => error);
        }

        // 401 alan istek refresh değilse: arka planda POST /auth/refresh dene, başarılıysa orijinal isteği tekrarla
        return authService.refreshTokenAndSave().pipe(
          switchMap((refreshSuccess) => {
            if (refreshSuccess) return next(req);
            if (typeof window !== 'undefined') authService.logout();
            if (typeof window !== 'undefined') toastService.show(errorMessage, 'error');
            return throwError(() => error);
          }),
          catchError(() => {
            if (typeof window !== 'undefined') authService.logout();
            if (typeof window !== 'undefined') toastService.show(errorMessage, 'error');
            return throwError(() => error);
          })
        );
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
      } else if (error.status === 429) {
        // Too Many Requests - rate limit aşıldı
        errorMessage = error.error?.message ||
          'Çok fazla istek gönderdiniz. Lütfen kısa bir süre bekleyip tekrar deneyin.';
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

      // Re-throw the error so components can still handle it if needed
      return throwError(() => error);
    })
  );
};
