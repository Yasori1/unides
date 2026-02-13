import { HttpContextToken } from '@angular/common/http';

/**
 * Bu istekte Authorization header eklenmesin (public liste için).
 * Örn: Anasayfa Topluluklar sayfası — kurumsal giriş yapılmış olsa bile tüm aktif topluluklar gelsin.
 */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
