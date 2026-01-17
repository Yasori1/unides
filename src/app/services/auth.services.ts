import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of, map, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { isTokenExpired, getTokenRemainingTime, decodeJwtToken } from '../utils/security.utils';

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
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Backend API URL - environment'tan alınıyor
  private apiUrl = environment.apiUrl;

  // Token refresh durumu (çoklu refresh isteğini önlemek için)
  private isRefreshing = false;

  constructor(private http: HttpClient, private router: Router) {
    // Token expiration kontrolü için periyodik kontrol başlat
    if (typeof window !== 'undefined') {
      this.startTokenExpirationCheck();
    }
  }

  /**
   * Periyodik token süresi kontrolü
   * Token süresi dolmak üzereyse otomatik refresh dener
   */
  private startTokenExpirationCheck(): void {
    // Her 60 saniyede token süresini kontrol et
    setInterval(() => {
      const token = this.getToken();
      if (token) {
        const remainingTime = getTokenRemainingTime(token);
        // Token 5 dakikadan az kaldıysa refresh dene
        if (remainingTime > 0 && remainingTime < 300) {
          this.refreshTokenIfNeeded();
        }
      }
    }, 60000);
  }

  /**
   * Token'ı yenile (gerekirse)
   */
  private refreshTokenIfNeeded(): void {
    if (this.isRefreshing) return;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return;

    this.isRefreshing = true;
    this.refreshToken().subscribe({
      next: () => {
        this.isRefreshing = false;
      },
      error: () => {
        this.isRefreshing = false;
        // Refresh başarısız - kullanıcı tekrar giriş yapmalı
        // Sessiz fail - kullanıcı mevcut token'la devam edebilir (süresi dolana kadar)
      }
    });
  }

  // --- MERKEZİ GİRİŞ METODU (SWAGGER: POST /api/Auth/login) ---
  // Tüm kullanıcı tipleri aynı endpoint üzerinden giriş yapar,
  // Backend rolü response içinde döner veya token'a gömer.
  private login(email: string, password: string, roleId: number): Observable<LoginResponse> {
    const payload = { email, password, roleId };
    return this.http.post<LoginResponse>(`${this.apiUrl}/Auth/login`, payload).pipe(
      tap((response: any) => {
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
          this.saveRefreshToken(refresh);
        }

        const userObj = {
          id: response?.id || response?.Id || response?.user?.id,
          name: response?.fullName || response?.FullName || response?.user?.name,
          email: response?.email || response?.Email || response?.user?.email,
          role: roleName,
        };
        this.saveUser(userObj);

        if (roleName) {
          this.saveUserType(roleName);
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

  // --- 3. TOPLULUK GİRİŞİ ---
  loginCommunity(email: string, password: string): Observable<LoginResponse> {
    return this.login(email, password, 3).pipe(
      // 3 = Topluluk
      tap(() => this.saveUserType('community'))
    );
  }

  // --- 4. KAYIT OL (REGISTER) ---
  // Swagger: POST /api/Auth/register
  registerStudent(data: RegisterRequest): Observable<any> {
    // Backend tek bir register noktası sunuyor.
    // Backend formatı: { fullName, email, password, roleId }
    const backendData = {
      fullName: data.name,
      email: data.email,
      password: data.password,
      roleId: 1, // 1 = Öğrenci
    };
    return this.http.post(`${this.apiUrl}/Auth/register`, backendData);
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
  registerCommunity(data: RegisterRequest): Observable<any> {
    const backendData = {
      fullName: data.name,
      email: data.email,
      password: data.password,
      roleId: 3, // 3 = Topluluk
    };
    return this.http.post(`${this.apiUrl}/Auth/register`, backendData);
  }

  // --- 7. REFRESH TOKEN (SWAGGER: POST /api/Auth/refresh) ---
  /**
   * Token yenileme - Mevcut refresh token'ı kullanarak yeni access token alır
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshTokenValue = this.getRefreshToken();
    const currentToken = this.getToken();

    if (!refreshTokenValue) {
      return of({} as LoginResponse);
    }

    // Backend'e refresh token gönder
    const payload = {
      refreshToken: refreshTokenValue,
      accessToken: currentToken, // Bazı backend'ler mevcut token'ı da ister
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/Auth/refresh`, payload).pipe(
      tap((response: any) => {
        const newToken =
          response?.accessToken ||
          response?.AccessToken ||
          response?.token ||
          response?.Token ||
          null;
        const newRefresh =
          response?.refreshToken || response?.RefreshToken || response?.refresh || null;

        if (newToken) {
          this.saveToken(newToken);
        }
        if (newRefresh) {
          this.saveRefreshToken(newRefresh);
        }
      }),
      catchError(() => {
        // Refresh token geçersiz veya süresi dolmuş
        // Kullanıcıyı logout yapmıyoruz, sadece refresh'i durduruyoruz
        // Mevcut token süresi dolduğunda kullanıcı otomatik logout olacak
        return of({} as LoginResponse);
      })
    );
  }

  // --- 8. ÇIKIŞ YAP (LOGOUT) ---
  // Swagger: POST /api/Auth/logout
  private logoutBackend(): Observable<any> {
    const token = this.getToken();
    const refreshTokenValue = this.getRefreshToken();

    // Backend'e logout bildir (token invalidation için)
    return this.http.post(`${this.apiUrl}/Auth/logout`, {
      refreshToken: refreshTokenValue
    });
  }

  // --- ORTAK YARDIMCI METOTLAR ---
  saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  saveRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  saveUser(user: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_info', JSON.stringify(user));
    }
  }

  getUser(): any | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user_info');
    try {
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  saveUserType(type: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_type', type);
    }
  }

  getUserType(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('user_type');
  }

  /**
   * Güvenli logout - tüm auth verilerini temizler
   * Backend'e logout isteği atar ve local storage'ı temizler
   */
  logout(): void {
    // Önce local temizliği yap (her durumda çalışmalı)
    this.clearAllAuthData();

    // Backend'e logout isteği at (sessiz - hata durumunda bile devam et)
    this.logoutBackend()
      .pipe(
        catchError((err) => {
          // Backend logout hatası - önemsiz, local temizlik yapıldı
          // Production'da log gösterme
          return of(null);
        })
      )
      .subscribe();

    // Anasayfaya yönlendir
    this.router.navigate(['/']);
  }

  /**
   * Tüm auth verilerini temizle
   * Private metod - doğrudan çağırılmamalı, logout() kullan
   */
  private clearAllAuthData(): void {
    if (typeof window === 'undefined') return;

    // Ana auth verileri
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');

    // Ek güvenlik: olası diğer auth-related anahtarları da temizle
    const keysToRemove = ['session_id', 'remember_me', 'last_login'];
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    });

    // Session storage'ı da temizle
    try {
      sessionStorage.clear();
    } catch {
      // Ignore errors
    }
  }

  /**
   * Kullanıcının giriş yapıp yapmadığını kontrol et
   * Token varlığı VE geçerliliğini kontrol eder
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Token süresi dolmuş mu kontrol et
    if (isTokenExpired(token)) {
      // Token süresi dolmuş - temizle
      this.clearAllAuthData();
      return false;
    }

    return true;
  }

  /**
   * Token'ın kalan süresini saniye cinsinden döndür
   */
  getTokenRemainingSeconds(): number {
    const token = this.getToken();
    if (!token) return 0;
    return getTokenRemainingTime(token);
  }

  /**
   * Update user profile (name)
   * Uses backend endpoint: PUT /api/Auth/update-profile
   * Backend endpoint must exist - no localStorage fallback
   */
  updateProfile(name: string): Observable<{ message: string }> {
    const payload = {
      fullName: name,
    };

    // Backend endpoint: PUT /api/Auth/update-profile
    // Auth interceptor automatically adds Authorization header and Content-Type if token exists
    return this.http.put<{ message: string }>(`${this.apiUrl}/Auth/update-profile`, payload).pipe(
      tap((response) => {
        // Backend'den başarılı yanıt geldiğinde localStorage'ı da güncelle (sync için)
        const user = this.getUser();
        if (user) {
          user.name = name;
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
