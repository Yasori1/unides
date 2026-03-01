import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.services';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Kullanıcı giriş yapmış mı ve token geçerli mi?
    // isAuthenticated() artık token expiry kontrolü de yapıyor
    if (!authService.isAuthenticated()) {
        // Giriş yapmamışsa veya token süresi dolmuşsa her zaman anasayfaya yönlendir
        router.navigate(['/']);
        return false;
    }

    // 2. Beklenen rolü kontrol et
    const expectedRole = route.data['expectedRole'];
    const userType = authService.getNormalizedUserType();

    // Rol kontrolü: expectedRole ile normalize edilmiş rolü karşılaştır (eski localStorage "ToplulukBaskani" vb. de geçer)
    if (expectedRole && userType !== expectedRole) {
        // Yanlış rol (örn: öğrenci, kurumsal dashboard'a girmeye çalışıyor)
        // Ana sayfaya veya kendi dashboard'una yönlendirebiliriz
        router.navigate(['/']); // Güvenli liman
        return false;
    }

    // 3. Topluluk başkanı: onay beklese de dashboard'a erişebilir (Profil sekmesi onay aşamasında salt okunur)

    // Her şey yolunda - token geçerli ve rol uygun
    return true;
};
