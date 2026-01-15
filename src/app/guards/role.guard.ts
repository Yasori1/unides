import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.services';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Kullanıcı giriş yapmış mı?
    if (!authService.isAuthenticated()) {
        // Giriş yapmamışsa login sayfasına at
        // İstenirse gidilmek istenen URL query param olarak eklenebilir
        router.navigate(['/login']);
        return false;
    }

    // 2. Beklenen rolü kontrol et
    const expectedRole = route.data['expectedRole'];
    const userType = authService.getUserType();

    // Rol kontrolü:
    // Eğer route data'da 'expectedRole' tanımlıysa, kullanıcının rolüyle eşleşmeli
    if (expectedRole && userType !== expectedRole) {
        // Yanlış rol (örn: öğrenci, kurumsal dashboard'a girmeye çalışıyor)
        // Ana sayfaya veya kendi dashboard'una yönlendirebiliriz
        router.navigate(['/']); // Güvenli liman
        return false;
    }

    // Her şey yolunda
    return true;
};
