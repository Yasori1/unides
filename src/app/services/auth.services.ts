import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger.util';

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

/** Kayıt sonrası e-posta doğrulama akışı: token dönmez, yönlendirme URL'i döner */
export interface RegisterResponse {
  redirectUrl: string;
  message: string;
  email: string;
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
    // --- TEST USER BYPASS ---
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
          localStorage.setItem('refresh_token', refresh);
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
  registerCommunity(data: RegisterRequest): Observable<any> {
    const backendData = {
      fullName: data.name,
      email: data.email,
      password: data.password,
      roleId: 3, // 3 = Topluluk
    };
    return this.http.post(`${this.apiUrl}/Auth/register`, backendData);
  }

  // --- MAİLİ TEKRAR GÖNDER (Resend verification) ---
  // POST /api/auth/resend-verification — Body: { "email": "..." }
  resendVerificationEmail(email: string): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.apiUrl}/Auth/resend-verification`, {
      email: email.trim(),
    });
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
    localStorage.setItem('user_type', type);
  }
  getUserType(): string | null {
    return localStorage.getItem('user_type');
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
