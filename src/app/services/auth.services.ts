import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpContext } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger.util';
import { SKIP_AUTH } from '../core/http-context-tokens';

export interface LoginResponse {
  // Eski/varsayılan alanlar
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'corporate' | 'community' | 'admin';
  };
  // Yeni alanlar (backend AuthResponse)
  accessToken?: string;
  AccessToken?: string;
  RefreshToken?: string;
  refresh?: string;
  roleName?: string;
  RoleName?: string;
  id?: number;
  fullName?: string;
  email?: string;
  /**
   * Efektif rol ID: 2=Normal GSB, 6=UNIDES_GODMODE, 7=UNIDES_DUYURU
   * Backend, UserPermission tablosuna göre hesaplayıp döner.
   */
  roleId?: number;
  RoleId?: number;
  /**
   * UserPermission tablosundan gelen görev listesi.
   * Örn: ["UNIDES_GODMODE"], ["UNIDES_DUYURU"], []
   */
  permissions?: string[];
  Permissions?: string[];
  /** OTP gerekli ise token dönülmez; doğrulama sayfasına yönlendirilir */
  requiresOtp?: boolean;
  otpRequestId?: string;
  OtpRequestId?: string;
  otpExpiresAt?: string;
  OtpExpiresAt?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** Kayıt sonrası e-posta doğrulama akışı: token dönmez, yönlendirme URL'i döner */
export interface RegisterResponse {
  redirectUrl: string;
  message: string;
  email: string;
}

/** E-posta doğrulama cevabı (POST /api/Auth/verify-email). Topluluk akışında requiresCommunitySetup + setupToken; diğer durumda accessToken/refreshToken. */
export interface VerifyEmailResponse {
  requiresCommunitySetup?: boolean;
  RequiresCommunitySetup?: boolean;
  setupToken?: string;
  SetupToken?: string;
  setupTokenExpiresAt?: string;
  SetupTokenExpiresAt?: string;
  email?: string;
  Email?: string;
  accessToken?: string;
  AccessToken?: string;
  refreshToken?: string;
  RefreshToken?: string;
  token?: string;
  Token?: string;
  refresh?: string;
  user?: { id?: number; name?: string; email?: string; role?: string };
  roleName?: string;
  RoleName?: string;
  id?: number;
  fullName?: string;
  FullName?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Backend API URL - environment'tan alınıyor
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) { }

  // --- MERKEZİ GİRİŞ METODU (SWAGGER: POST /api/Auth/login) ---
  // Tüm kullanıcı tipleri aynı endpoint üzerinden giriş yapar,
  // Backend rolü response içinde döner veya token'a gömer.
  private login(email: string, password: string, roleId: number): Observable<LoginResponse> {
    const payload = { email, password, roleId };
    return this.http.post<LoginResponse>(`${this.apiUrl}/Auth/login`, payload).pipe(
      tap((response: any) => {
        const requiresOtp = response?.requiresOtp === true;
        if (requiresOtp) return;
        const token =
          response?.accessToken ||
          response?.AccessToken ||
          response?.token ||
          response?.Token ||
          null;
        const refresh =
          response?.refreshToken || response?.RefreshToken || response?.refresh || null;
        const roleName = response?.roleName || response?.RoleName || response?.user?.role;

        if (token) {
          this.saveToken(token);
        }
        if (refresh) {
          localStorage.setItem('refresh_token', refresh);
        }

        const userObj = {
          id: response?.id || response?.Id || response?.user?.id,
          name: response?.fullName || response?.FullName || response?.user?.name,
          email: response?.email || response?.Email || response?.user?.email,
          role: roleName,
        };
        if (token) {
          this.saveUser(userObj);
          if (roleName) {
            this.saveUserType(roleName);
          }
          const numericRoleId = this.extractRoleIdFromResponse(response, token);
          if (numericRoleId !== null) {
            this.saveRoleId(numericRoleId);
          }
          this.savePermissions(this.extractPermissionsFromResponse(response));
        }
      })
    );
  }

  // --- 1. ÖĞRENCİ GİRİŞİ ---
  // Componentlerdeki mevcut yapıyı bozmamak için wrapper kullanıyoruz.
  loginStudent(email: string, password: string): Observable<LoginResponse> {
    return this.login(email, password, 1).pipe(
      // 1 = Öğrenci
      tap(() => {
        // Frontend tarafında 'student' olduğunu garantiye alıyoruz
        // (Backend response.role dönmezse varsayılan olarak set edilebilir)
        this.saveUserType('student');
      })
    );
  }

  // --- 2. KURUMSAL GİRİŞ ---
  loginCorporate(email: string, password: string): Observable<LoginResponse> {
    return this.login(email, password, 2).pipe(
      // 2 = Kurumsal (GSB)
      tap(() => this.saveUserType('corporate'))
    );
  }

  /**
   * @deprecated Artık kullanılmıyor.
   * Yeni yapıda tüm GSB kullanıcıları roleId=2 ile giriş yapar;
   * backend UserPermission tablosundan efektif rolü (6/7) hesaplar ve token'a gömer.
   * loginCorporate() kullanın.
   */
  loginCorporateAnnouncement(email: string, password: string): Observable<LoginResponse> {
    return this.loginCorporate(email, password);
  }

  /** Kurumsal giriş doğrulama kodu ile giriş tamamla. Backend: POST /api/Auth/verify-corporate-login */
  verifyCorporateCode(email: string, code: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/Auth/verify-corporate-login`, {
        email: email.trim(),
        code: code.trim(),
      })
      .pipe(
        tap((response: any) => {
          const token =
            response?.accessToken ||
            response?.AccessToken ||
            response?.token ||
            response?.Token ||
            null;
          const refresh =
            response?.refreshToken || response?.RefreshToken || response?.refresh || null;
          const roleName =
            response?.roleName || response?.RoleName || response?.user?.role || 'corporate';

          if (token) {
            this.saveToken(token);
          }
          if (refresh) {
            localStorage.setItem('refresh_token', refresh);
          }
          const userObj = {
            id: response?.id || response?.Id || response?.user?.id,
            name: response?.fullName || response?.FullName || response?.user?.name,
            email: response?.email || response?.Email || response?.user?.email,
            role: roleName,
          };
          this.saveUser(userObj);
          this.saveUserType('corporate');
          const tokenValue =
            response?.accessToken ||
            response?.AccessToken ||
            response?.token ||
            response?.Token ||
            null;
          const numericRoleId = this.extractRoleIdFromResponse(response, tokenValue);
          if (numericRoleId !== null) {
            this.saveRoleId(numericRoleId);
          }
          this.savePermissions(this.extractPermissionsFromResponse(response));
        })
      );
  }

  /** Kurumsal doğrulama kodunu tekrar gönder. Backend: POST /api/Auth/resend-corporate-code */
  resendCorporateVerificationCode(email: string): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.apiUrl}/Auth/resend-corporate-code`, {
      email: email.trim(),
    });
  }

  /** OTP ile giriş tamamla (topluluk ve kurumsal için ortak). Backend: POST /api/Auth/login-otp */
  verifyLoginOtp(otpRequestId: string, code: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/Auth/login-otp`, {
        otpRequestId: otpRequestId.trim(),
        code: code.trim(),
        rememberDevice: true,
      })
      .pipe(
        tap((response: any) => {
          const token =
            response?.accessToken ||
            response?.AccessToken ||
            response?.token ||
            response?.Token ||
            null;
          const refresh =
            response?.refreshToken || response?.RefreshToken || response?.refresh || null;
          const roleName =
            response?.roleName || response?.RoleName || response?.user?.role || 'community';

          if (token) {
            this.saveToken(token);
          }
          if (refresh) {
            localStorage.setItem('refresh_token', refresh);
          }
          const userObj = {
            id: response?.id || response?.Id || response?.user?.id,
            name: response?.fullName || response?.FullName || response?.user?.name,
            email: response?.email || response?.Email || response?.user?.email,
            role: roleName,
          };
          this.saveUser(userObj);
          this.saveUserType(roleName);
          const tokenValue =
            response?.accessToken ||
            response?.AccessToken ||
            response?.token ||
            response?.Token ||
            null;
          const numericRoleId = this.extractRoleIdFromResponse(response, tokenValue);
          if (numericRoleId !== null) {
            this.saveRoleId(numericRoleId);
          }
          this.savePermissions(this.extractPermissionsFromResponse(response));
        })
      );
  }

  /** OTP kodunu tekrar gönder. Backend: POST /api/Auth/login-otp/resend */
  resendLoginOtp(otpRequestId: string): Observable<LoginResponse & { otpRequestId?: string }> {
    return this.http.post<LoginResponse & { otpRequestId?: string }>(
      `${this.apiUrl}/Auth/login-otp/resend`,
      { otpRequestId: otpRequestId.trim() }
    );
  }

  // --- 3. TOPLULUK GİRİŞİ ---
  loginCommunity(email: string, password: string): Observable<LoginResponse> {
    return this.login(email, password, 3).pipe(
      // 3 = Topluluk
      tap(() => this.saveUserType('community'))
    );
  }

  // --- 4. KAYIT OL (REGISTER) ---
  // POST /api/Auth/register — E-posta doğrulamalı akış:
  // Cevap: redirectUrl, message, email (token dönmez; kullanıcı PendingEmailVerification'a yazılır)
  registerStudent(data: RegisterRequest): Observable<RegisterResponse> {
    const backendData = {
      fullName: data.name,
      email: data.email,
      password: data.password,
      roleId: 1, // 1 = Öğrenci
    };
    return this.http.post<RegisterResponse>(`${this.apiUrl}/Auth/register`, backendData);
  }

  // --- 5. KURUMSAL KAYIT ---
  registerCorporate(data: RegisterRequest): Observable<any> {
    const backendData = {
      fullName: data.name,
      email: data.email,
      password: data.password,
      roleId: 2, // 2 = Kurumsal (GSB)
    };
    return this.http.post(`${this.apiUrl}/Auth/register`, backendData);
  }

  // --- 6. TOPLULUK KAYIT ---
  // Backend: RoleId 4 (reddedilmiş) veya 5 (silinmiş) olanlar tekrar kayıt olabilir; RegisterCommand bu e-postaları kabul eder.
  registerCommunity(data: RegisterRequest): Observable<any> {
    const backendData = {
      fullName: data.name,
      email: data.email,
      password: data.password,
      roleId: 3, // 3 = Topluluk Başkanı
    };
    return this.http.post(`${this.apiUrl}/Auth/register`, backendData);
  }

  // --- TOPLULUK KURULUM: BANNER / LOGO UPLOAD (JWT yok, X-Setup-Token ile) ---
  // POST /api/Auth/community-setup/banner ve .../logo — setupToken header veya body'den.
  uploadSetupBanner(file: File, setupToken: string): Observable<string> {
    const formData = new FormData();
    formData.append('File', file, file.name);
    const headers = new HttpHeaders().set('X-Setup-Token', setupToken.trim());
    const context = new HttpContext().set(SKIP_AUTH, true);
    return this.http
      .post<{ BannerUrl?: string; bannerUrl?: string }>(
        `${this.apiUrl}/Auth/community-setup/banner`,
        formData,
        { headers, context }
      )
      .pipe(map((r) => r.BannerUrl ?? r.bannerUrl ?? ''));
  }

  uploadSetupLogo(file: File, setupToken: string): Observable<string> {
    const formData = new FormData();
    formData.append('File', file, file.name);
    const headers = new HttpHeaders().set('X-Setup-Token', setupToken.trim());
    const context = new HttpContext().set(SKIP_AUTH, true);
    return this.http
      .post<{ LogoUrl?: string; logoUrl?: string }>(
        `${this.apiUrl}/Auth/community-setup/logo`,
        formData,
        { headers, context }
      )
      .pipe(map((r) => r.LogoUrl ?? r.logoUrl ?? ''));
  }

  // --- 7. TOPLULUK KURULUM TAMAMLA ---
  // POST /api/Auth/complete-community-setup
  // E-posta doğrulandıktan sonra topluluk başkanı topluluk bilgilerini girerek hesap+topluluk oluşturur.
  // Backend: Mevcut kullanıcı RoleId 4 veya 5 ise RoleId 3'e çevrilir (tekrar topluluk oluşturma).
  // setupToken: verify-email cevabından gelen token; community: CreateCommunityDto (bannerUrl/logoUrl upload sonrası eklenir)
  completeCommunitySetup(setupToken: string, community: any): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/Auth/complete-community-setup`, {
        setupToken,
        community,
      })
      .pipe(
        tap((response: any) => {
          const token =
            response?.accessToken ||
            response?.AccessToken ||
            response?.token ||
            null;
          const refresh =
            response?.refreshToken || response?.RefreshToken || null;
          const roleName =
            response?.roleName || response?.RoleName || 'community';

          if (token) {
            this.saveToken(token);
          }
          if (refresh) {
            localStorage.setItem('refresh_token', refresh);
          }

          const userObj = {
            id: response?.id || response?.Id,
            name: response?.fullName || response?.FullName,
            email: response?.email || response?.Email,
            role: roleName,
          };
          this.saveUser(userObj);
          this.saveUserType('community');
          const tokenValue =
            response?.accessToken ||
            response?.AccessToken ||
            response?.token ||
            response?.Token ||
            null;
          const numericRoleId = this.extractRoleIdFromResponse(response, tokenValue);
          if (numericRoleId !== null) {
            this.saveRoleId(numericRoleId);
          }
        })
      );
  }

  // --- MAİLİ TEKRAR GÖNDER (Resend verification) ---
  // POST /api/auth/resend-verification — Body: { "email": "..." }
  resendVerificationEmail(email: string): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.apiUrl}/Auth/resend-verification`, {
      email: email.trim(),
    });
  }

  /**
   * E-posta doğrulama (mail linkindeki token ile).
   * Backend: POST /api/Auth/verify-email — Body: { "token": "MAIL_TOKEN" }
   * Cevap: requiresCommunitySetup, setupToken, setupTokenExpiresAt, email (topluluk akışında); veya accessToken/refreshToken.
   */
  verifyEmail(token: string): Observable<VerifyEmailResponse> {
    const context = new HttpContext().set(SKIP_AUTH, true);
    return this.http.post<VerifyEmailResponse>(`${this.apiUrl}/Auth/verify-email`, { token: token.trim() }, { context });
  }

  // --- REFRESH TOKEN (SWAGGER: POST /api/Auth/refresh) ---
  refreshToken(): Observable<any> {
    // Token yenileme ihtiyacı olursa bu metot kullanılabilir
    return this.http.post(`${this.apiUrl}/Auth/refresh`, {});
  }

  // --- 6. ÇIKIŞ YAP (LOGOUT) ---
  // Swagger: POST /api/Auth/logout
  private logoutBackend(): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/logout`, {});
  }

  // --- ORTAK YARDIMCI METOTLAR ---
  /** Backend rol adlarını frontend beklenen değerlere çevirir (roleGuard ve menü 'community' bekler). */
  private normalizeRoleForFrontend(roleName: string | null | undefined): 'student' | 'corporate' | 'community' {
    if (!roleName || typeof roleName !== 'string') return 'student';
    const r = roleName.trim().toLowerCase();
    if (r === 'community' || r === 'toplulukbaskani' || r === 'topluluk' || r.includes('topluluk')) return 'community';
    if (r === 'corporate' || r === 'kurumsal' || r === 'gsb' || r.includes('kurumsal')) return 'corporate';
    if (r === 'student' || r === 'öğrenci' || r === 'ogrenci' || r === 'üye' || r === 'uye' || r.includes('öğrenci')) return 'student';
    return 'student';
  }

  saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  saveUser(user: any): void {
    localStorage.setItem('user_info', JSON.stringify(user));
  }
  getUser(): any | null {
    const user = localStorage.getItem('user_info');
    return user ? JSON.parse(user) : null;
  }
  saveUserType(type: string): void {
    const normalized = this.normalizeRoleForFrontend(type);
    localStorage.setItem('user_type', normalized);
  }
  getUserType(): string | null {
    return localStorage.getItem('user_type');
  }
  /** RoleId bilgisini localStorage'a yazar (ör: 2, 3, 6, 7). */
  private saveRoleId(roleId: number): void {
    try {
      localStorage.setItem('role_id', String(roleId));
    } catch {
      // localStorage erişilemezse sessizce geç
    }
  }

  /** Permissions listesini localStorage'a yazar. */
  private savePermissions(permissions: string[]): void {
    try {
      localStorage.setItem('user_permissions', JSON.stringify(permissions));
    } catch {
      // localStorage erişilemezse sessizce geç
    }
  }

  /** Backend cevabından permissions listesini çıkarır. */
  private extractPermissionsFromResponse(response: any): string[] {
    const raw = response?.permissions ?? response?.Permissions;
    if (Array.isArray(raw)) return raw.filter((p): p is string => typeof p === 'string');
    return [];
  }

  /** UserPermission tablosundan gelen görev listesini döner. */
  getPermissions(): string[] {
    try {
      const raw = localStorage.getItem('user_permissions');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** Belirtilen permission'ın mevcut kullanıcıda olup olmadığını kontrol eder (büyük/küçük harf duyarsız). */
  hasPermission(perm: string): boolean {
    return this.getPermissions().some(p => p.toUpperCase() === perm.toUpperCase());
  }

  /**
   * Kullanıcının UNIDES_GODMODE yetkisine sahip olup olmadığını döner.
   * roleId=6 VEYA permissions içinde "UNIDES_GODMODE" varsa true.
   */
  isGodMode(): boolean {
    return this.getRoleId() === 6 || this.hasPermission('UNIDES_GODMODE');
  }

  /**
   * Kullanıcının Duyuru Admin yetkisine sahip olup olmadığını döner.
   * roleId=7 VEYA permissions içinde "UNIDES_DUYURU" varsa true.
   */
  isDuyuruAdmin(): boolean {
    return this.getRoleId() === 7 || this.hasPermission('UNIDES_DUYURU');
  }

  /**
   * Herhangi bir GSB kullanıcısı mı? (roleId 2, 6 veya 7)
   * Dashboard'a erişim için kullanılır.
   */
  isGsb(): boolean {
    const roleId = this.getRoleId();
    return roleId === 2 || roleId === 6 || roleId === 7;
  }

  /**
   * Duyuru oluşturma/güncelleme/silme yetkisi var mı?
   * Godmode veya DuyuruAdmin ise true.
   */
  canManageAnnouncements(): boolean {
    return this.isGodMode() || this.isDuyuruAdmin();
  }
  /** Backend cevabından veya JWT token payload'ından RoleId bilgisini çıkarır. */
  private extractRoleIdFromResponse(response: any, token?: string | null): number | null {
    let rawRoleId: any =
      response?.roleId ??
      response?.RoleId ??
      response?.user?.roleId ??
      response?.user?.RoleId ??
      null;

    if (typeof rawRoleId === 'string') {
      const parsed = parseInt(rawRoleId, 10);
      rawRoleId = isNaN(parsed) ? null : parsed;
    }

    if (typeof rawRoleId === 'number' && !isNaN(rawRoleId)) {
      return rawRoleId;
    }

    // Cevapta yoksa token içinden okumayı dene
    const tokenToUse =
      token ||
      response?.accessToken ||
      response?.AccessToken ||
      response?.token ||
      response?.Token ||
      null;

    if (tokenToUse && tokenToUse.split('.').length === 3) {
      try {
        const payloadJson = atob(tokenToUse.split('.')[1]);
        const payload = JSON.parse(payloadJson);
        let claimRoleId: any = payload?.roleId ?? payload?.RoleId ?? payload?.RoleID;
        if (typeof claimRoleId === 'string') {
          const parsed = parseInt(claimRoleId, 10);
          claimRoleId = isNaN(parsed) ? null : parsed;
        }
        if (typeof claimRoleId === 'number' && !isNaN(claimRoleId)) {
          return claimRoleId;
        }
      } catch {
        // Token parse edilemezse sessizce geç
      }
    }

    return null;
  }
  /** RoleId bilgisini döner; yoksa null. */
  getRoleId(): number | null {
    try {
      const raw = localStorage.getItem('role_id');
      if (!raw) return null;
      const n = parseInt(raw, 10);
      return isNaN(n) ? null : n;
    } catch {
      return null;
    }
  }
  /** Guard ve menü için: backend'den gelen veya eski kayıtlı rol adını 'student'|'corporate'|'community' olarak döner. */
  getNormalizedUserType(): 'student' | 'corporate' | 'community' {
    return this.normalizeRoleForFrontend(this.getUserType());
  }

  // --- TOPLULUK ONAY DURUMU ---
  /** Topluluk onay durumunu localStorage'a kaydet */
  saveCommunityApproved(approved: boolean): void {
    localStorage.setItem('community_approved', JSON.stringify(approved));
  }

  /** Topluluk onay durumunu oku. null = bilinmiyor */
  isCommunityApproved(): boolean | null {
    const val = localStorage.getItem('community_approved');
    if (val === null) return null;
    try {
      return JSON.parse(val) === true;
    } catch {
      return null;
    }
  }

  logout(): void {
    // Token varsa backend'e logout isteği atıyoruz (Token'ı geçersiz kılmak için)
    // Token yoksa veya geçersizse backend'e istek atmaya gerek yok (401 hatası döngüsünü önlemek için)
    const token = this.getToken();
    if (token) {
      this.logoutBackend()
        .pipe(
          catchError((err) => {
            // 401 hatası normal olabilir (token zaten geçersiz), sessizce handle et
            if (err.status !== 401) {
              Logger.warn('Backend logout hatası (önemsiz):', err);
            }
            return of(null); // Hata olsa bile local temizliğe devam et
          })
        )
        .subscribe(() => {
          // İstek tamamlanınca veya hata verince çalışır
        });
    }

    // Local temizlik her durumda yapılır
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');
    localStorage.removeItem('role_id');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('community_approved');
    // Anasayfaya yönlendir
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // JWT token'ı decode et ve expiry kontrolü yap
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // JWT exp is in seconds, convert to milliseconds
      const now = Date.now();

      // Token expire olmuşsa false döndür
      if (now >= expiry) {
        // Token expire olmuş, localStorage'dan temizle
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      // Token decode edilemiyorsa geçersiz token
      Logger.warn('Token decode edilemedi, geçersiz token:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Update user profile (name)
   * Uses backend endpoint: PUT /api/Auth/update-fullname
   * Backend expects: { FullName: string }
   * Backend returns: { fullName: string } or { FullName: string }
   */
  updateProfile(name: string): Observable<{ fullName?: string; FullName?: string }> {
    const payload = {
      FullName: name, // Backend PascalCase bekliyor
    };

    // Backend endpoint: PUT /api/Auth/update-fullname
    // Auth interceptor automatically adds Authorization header and Content-Type if token exists
    return this.http
      .put<{ fullName?: string; FullName?: string }>(`${this.apiUrl}/Auth/update-fullname`, payload)
      .pipe(
        tap((response) => {
          // Backend'den başarılı yanıt geldiğinde localStorage'ı da güncelle (sync için)
          const user = this.getUser();
          if (user) {
            // Response'dan gelen fullName'i kullan (eğer varsa), yoksa gönderdiğimiz name'i kullan
            const updatedName = response.fullName || response.FullName || name;
            user.name = updatedName;
            this.saveUser(user);
          }
        })
        // No catchError - let error interceptor handle errors
        // If backend endpoint doesn't exist, error interceptor will show error message
      );
  }

  /**
   * Change user password
   * Uses backend endpoint: POST /api/Auth/change-password
   * Backend expects: { Email, OldPassword, NewPassword, ConfirmNewPassword }
   */
  changePassword(
    email: string,
    oldPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Observable<{ message: string }> {
    // Backend PascalCase format bekliyor
    const payload = {
      Email: email,
      OldPassword: oldPassword,
      NewPassword: newPassword,
      ConfirmNewPassword: confirmNewPassword,
    };

    // Backend endpoint: POST /api/Auth/change-password
    // Auth interceptor automatically adds Authorization header and Content-Type if token exists
    return this.http.post<{ message: string }>(`${this.apiUrl}/Auth/change-password`, payload);
  }
}
