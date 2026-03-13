import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.services';

/**
 * Genel rol guard'ı.
 * route.data['expectedRole'] → 'corporate' | 'community' | 'student'
 */
export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        router.navigate(['/']);
        return false;
    }

    const expectedRole = route.data['expectedRole'];
    const userType = authService.getNormalizedUserType();

    if (expectedRole && userType !== expectedRole) {
        router.navigate(['/']);
        return false;
    }

    return true;
};

/**
 * Duyuru yönetimi guard'ı.
 * Sadece UNIDES_GODMODE veya UNIDES_DUYURU yetkisine sahip GSB kullanıcıları erişebilir.
 * Kullanım: canActivate: [announcementGuard]
 */
export const announcementGuard: CanActivateFn = (_route, _state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        router.navigate(['/']);
        return false;
    }

    if (!authService.canManageAnnouncements()) {
        router.navigate(['/corporate-dashboard']);
        return false;
    }

    return true;
};

/**
 * Godmode guard'ı.
 * Sadece UNIDES_GODMODE yetkisine sahip GSB kullanıcıları erişebilir.
 * Kullanım: canActivate: [godModeGuard]
 */
export const godModeGuard: CanActivateFn = (_route, _state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        router.navigate(['/']);
        return false;
    }

    if (!authService.isGodMode()) {
        router.navigate(['/corporate-dashboard']);
        return false;
    }

    return true;
};
