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
    const rawUserType = authService.getUserType();
    
    // userType'ı normalize et: '1'/'student' → 'student', '2'/'corporate' → 'corporate', '3'/'community' → 'community'
    let userType: string | null;
    if (rawUserType === '1' || rawUserType === 'student') {
        userType = 'student';
    } else if (rawUserType === '2' || rawUserType === 'corporate') {
        userType = 'corporate';
    } else if (rawUserType === '3' || rawUserType === 'community') {
        userType = 'community';
    } else {
        userType = rawUserType;
    }

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
