import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.services';
import { TokenExpiryService } from '../services/token-expiry.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Auth Interceptor
 * - Her isteğe Authorization header ekler
 * - Token expired durumunda otomatik refresh yapar
 * - Refresh başarısız olursa kullanıcıyı logout eder
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenExpiryService = inject(TokenExpiryService);
  const router = inject(Router);

  // Public endpoints (token gerektirmeyen)
  const publicEndpoints = [
    '/api/Auth/login',
    '/api/Auth/register',
    '/api/Auth/refresh',
    '/api/Search',
    '/api/About',
    '/api/Forkod',
  ];

  const isPublicEndpoint = publicEndpoints.some((endpoint) => req.url.includes(endpoint));

  // Public endpoint ise token ekleme
  if (isPublicEndpoint) {
    return next(req);
  }

  // Token'ı al
  const token = authService.getToken();

  // Token yoksa isteği olduğu gibi gönder (backend 401 dönecek)
  if (!token) {
    return next(req);
  }

  // Token'ın geçerliliğini kontrol et
  const isValid = tokenExpiryService.isTokenValid(token);

  // Token geçersizse refresh dene
  if (!isValid) {
    return handleTokenRefresh(req, next, authService, router);
  }

  // Token geçerliyse isteğe ekle
  const clonedReq = addTokenToRequest(req, token);

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 hatası aldıysak token refresh dene
      if (error.status === 401) {
        return handleTokenRefresh(req, next, authService, router);
      }

      // Diğer hataları olduğu gibi geçir (error.interceptor handle edecek)
      return throwError(() => error);
    })
  );
};

/**
 * İsteğe Authorization header ekler
 */
function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Token refresh işlemi
 * - Eğer zaten refresh işlemi devam ediyorsa bekle
 * - Refresh başarılıysa yeni token ile isteği tekrarla
 * - Refresh başarısızsa logout yap
 */
function handleTokenRefresh(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
) {
  // Zaten refresh işlemi devam ediyorsa, yeni token'ı bekle
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        return next(addTokenToRequest(request, token!));
      })
    );
  }

  // Refresh işlemini başlat
  isRefreshing = true;
  refreshTokenSubject.next(null);

  return authService.refreshToken().pipe(
    switchMap((response: any) => {
      isRefreshing = false;

      // Yeni token'ı al
      const newToken =
        response?.accessToken ||
        response?.AccessToken ||
        response?.token ||
        response?.Token ||
        null;

      if (!newToken) {
        // Token alınamadı, logout yap
        performLogout(authService, router);
        return throwError(() => new Error('Token yenilenemedi'));
      }

      // Yeni token'ı kaydet
      authService.saveToken(newToken);

      // Yeni refresh token varsa kaydet
      const newRefreshToken =
        response?.refreshToken || response?.RefreshToken || response?.refresh || null;
      if (newRefreshToken && typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', newRefreshToken);
      }

      // Diğer bekleyen istekleri bilgilendir
      refreshTokenSubject.next(newToken);

      // Original isteği yeni token ile tekrarla
      return next(addTokenToRequest(request, newToken));
    }),
    catchError((error) => {
      isRefreshing = false;
      refreshTokenSubject.next(null);

      // Refresh token da geçersizse veya başka bir hata varsa logout yap
      console.error('Token refresh hatası:', error);

      // Network hatası mı yoksa 401/403 gibi auth hatası mı kontrol et
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 || error.status === 403) {
          // Auth hatası - kesinlikle logout yap
          performLogout(authService, router, 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        } else if (error.status === 0 || error.status >= 500) {
          // Network veya server hatası - logout yapma, kullanıcıyı bilgilendir
          console.warn('Geçici bağlantı hatası. Oturum korunuyor.');
          // Hatayı error.interceptor handle etsin
        }
      }

      return throwError(() => error);
    })
  );
}

/**
 * Kullanıcıyı logout eder
 */
function performLogout(authService: AuthService, router: Router, message?: string) {
  if (typeof window !== 'undefined') {
    // Token'ları temizle
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');

    // Kullanıcıyı bilgilendir
    if (message) {
      console.warn(message);
      // Toast service'i inject edemeyiz, bu yüzden mesajı AuthService üzerinden gösterebiliriz
      // veya error.interceptor handle etsin
    }

    // Login sayfasına yönlendir (mevcut URL'yi query param olarak ekle)
    const currentUrl = router.url;
    if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: currentUrl },
      });
    }
  }
}
