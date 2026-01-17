import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

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

  constructor(private http: HttpClient, private router: Router) {}

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
      tap((response) => {
        // Frontend tarafında hem '1' hem de 'student' olduğunu garantiye alıyoruz
        // (Backend response.role dönmezse varsayılan olarak set edilebilir)
        localStorage.setItem('user_type', '1'); // Backend roleId formatı
        console.log('[AuthService] Student login başarılı, user_type=1 kaydedildi');
        console.log('[AuthService] Response:', response);
      })
    );
  }

  // --- 2. KURUMSAL GİRİŞ ---
  loginCorporate(email: string, password: string): Observable<LoginResponse> {
    return this.login(email, password, 2).pipe(
      // 2 = Kurumsal (GSB)
      tap(() => {
        localStorage.setItem('user_type', '2'); // Backend roleId formatı
        console.log('[AuthService] Corporate login başarılı, user_type=2 kaydedildi');
      })
    );
  }

  // --- 3. TOPLULUK GİRİŞİ ---
  loginCommunity(email: string, password: string): Observable<LoginResponse> {
    return this.login(email, password, 3).pipe(
      // 3 = Topluluk
      tap(() => {
        localStorage.setItem('user_type', '3'); // Backend roleId formatı
        console.log('[AuthService] Community login başarılı, user_type=3 kaydedildi');
      })
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

  // --- 5. REFRESH TOKEN (SWAGGER: POST /api/Auth/refresh) ---
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token bulunamadı'));
    }

    // Backend refresh token'ı body'de veya cookie'de bekliyor
    // Cookie kullanıyorsak body boş gönderebiliriz
    const payload = {
      refreshToken: refreshToken
    };

    return this.http.post(`${this.apiUrl}/Auth/refresh`, payload).pipe(
      tap((response: any) => {
        // Yeni token'ları kaydet
        const token =
          response?.accessToken ||
          response?.AccessToken ||
          response?.token ||
          response?.Token ||
          null;
        const refresh =
          response?.refreshToken || response?.RefreshToken || response?.refresh || null;

        if (token) {
          this.saveToken(token);
        }
        if (refresh) {
          localStorage.setItem('refresh_token', refresh);
        }
      })
    );
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
    // Önce backend'e logout isteği atıyoruz (Token'ı geçersiz kılmak için)
    this.logoutBackend()
      .pipe(
        catchError((err) => {
          console.warn('Backend logout hatası (önemsiz):', err);
          return of(null); // Hata olsa bile local temizliğe devam et
        })
      )
      .subscribe(() => {
        // İstek tamamlanınca veya hata verince çalışır
      });

    // Local temizlik her durumda yapılır
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');
    // Anasayfaya yönlendir
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
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
