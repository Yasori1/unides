import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';

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
  // Swagger görseline göre Base URL
  // Endpointler /api/Auth/... şeklinde olduğu için base url:
  // Lokal geliştirmede proxy.conf.json ile aynı origin üzerinden /api
  // Canlıda domain reverse proxy de /api'yi backend'e yönlendirmeli.
  private apiUrl = '/api';

  constructor(private http: HttpClient, private router: Router) {}

  // --- MERKEZİ GİRİŞ METODU (SWAGGER: POST /api/Auth/login) ---
  // Tüm kullanıcı tipleri aynı endpoint üzerinden giriş yapar,
  // Backend rolü response içinde döner veya token'a gömer.
  private login(email: string, password: string): Observable<LoginResponse> {
    const payload = { email, password };
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
    return this.login(email, password).pipe(
      tap(() => {
        // Frontend tarafında 'student' olduğunu garantiye alıyoruz
        // (Backend response.role dönmezse varsayılan olarak set edilebilir)
        this.saveUserType('student');
      })
    );
  }

  // --- 2. KURUMSAL GİRİŞ ---
  loginCorporate(email: string, password: string): Observable<LoginResponse> {
    return this.login(email, password).pipe(tap(() => this.saveUserType('corporate')));
  }

  // --- 3. TOPLULUK GİRİŞİ ---
  loginCommunity(email: string, password: string): Observable<LoginResponse> {
    return this.login(email, password).pipe(tap(() => this.saveUserType('community')));
  }

  // --- 4. KAYIT OL (REGISTER) ---
  // Swagger: POST /api/Auth/register
  registerStudent(data: RegisterRequest): Observable<any> {
    // Backend tek bir register noktası sunuyor.
    return this.http.post(`${this.apiUrl}/Auth/register`, data);
  }

  // --- 5. REFRESH TOKEN (SWAGGER: POST /api/Auth/refresh) ---
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
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
