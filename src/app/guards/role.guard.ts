import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.services';
import { isTokenExpired, validateTokenRole, getRoleFromToken } from '../utils/security.utils';

/**
 * Role Guard with Enhanced Security
 * - Validates JWT token existence and format
 * - Checks token expiration
 * - Verifies role claims from token (not just localStorage)
 * - Falls back gracefully on validation failures
 */
export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Kullanıcı giriş yapmış mı? (Token var mı?)
    const token = authService.getToken();
    if (!token) {
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    // 2. Token süresi dolmuş mu?
    if (isTokenExpired(token)) {
        // Token expired - clear all auth data and redirect
        authService.logout();
        router.navigate(['/login'], {
            queryParams: {
                returnUrl: state.url,
                reason: 'session_expired'
            }
        });
        return false;
    }

    // 3. Beklenen rolü kontrol et
    const expectedRole = route.data['expectedRole'];

    if (expectedRole) {
        // A. Önce JWT token'dan rol kontrolü yap (daha güvenli)
        const tokenRole = getRoleFromToken(token);

        if (tokenRole) {
            // Token'da rol var - bununla karşılaştır
            if (!validateTokenRole(token, expectedRole)) {
                router.navigate(['/']);
                return false;
            }
        } else {
            // B. Token'da rol yoksa localStorage'a fallback yap (geriye uyumluluk)
            const userType = authService.getUserType();

            if (userType !== expectedRole) {
                router.navigate(['/']);
                return false;
            }
        }
    }

    // Her şey yolunda
    return true;
};
