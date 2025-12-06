import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';

// Backend AuthResponse formatı (PascalCase)
export interface AuthResponse {
  Id: number;
  FullName: string;
  Email: string;
  RoleName: string;
  AccessToken: string;
  RefreshToken: string;
}

// Eski interface (geriye uyumluluk için)
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'corporate' | 'community' | 'admin';
  };
}

export interface RegisterRequest {
  FullName: string;
  Email: string;
  Password: string;
  RoleId: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Proxy üzerinden çalışacak şekilde /api kullanıyoruz
  // proxy.conf.json /api isteklerini https://localhost:7069'a yönlendiriyor
  private apiUrl = '/api';

  constructor(private http: HttpClient, private router: Router) {}

  // --- MERKEZİ GİRİŞ METODU (SWAGGER: POST /api/Auth/login) ---
  // Tüm kullanıcı tipleri aynı endpoint üzerinden giriş yapar,
  // Backend rolü response içinde döner veya token'a gömer.
  private login(email: string, password: string, roleId?: number): Observable<AuthResponse> {
    // Backend LoginRequest formatı: { Email, Password, RoleId }
    const payload: any = { 
      Email: email, 
      Password: password 
    };
    if (roleId !== undefined) {
      payload.RoleId = roleId;
    }
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/login`, payload).pipe(
      tap((response) => {
        if (response.AccessToken) {
          // Backend'den gelen AuthResponse'u işle
          this.saveToken(response.AccessToken);
          if (response.RefreshToken) {
            localStorage.setItem('refresh_token', response.RefreshToken);
          }
          
          // Kullanıcı bilgilerini kaydet
          const userInfo = {
            id: response.Id,
            name: response.FullName,
            email: response.Email,
            role: response.RoleName
          };
          this.saveUser(userInfo);
          
          // Rol adını user_type olarak kaydet
          const roleMap: { [key: string]: string } = {
            'Student': 'student',
            'Corporate': 'corporate',
            'Community': 'community',
            'Admin': 'admin'
          };
          const userType = roleMap[response.RoleName] || response.RoleName.toLowerCase();
          this.saveUserType(userType);
        }
      })
    );
  }

  // --- 1. ÖĞRENCİ GİRİŞİ ---
  // Componentlerdeki mevcut yapıyı bozmamak için wrapper kullanıyoruz.
  loginStudent(email: string, password: string): Observable<AuthResponse> {
    return this.login(email, password, 1); // RoleId: 1 = Student
  }

  // --- 2. KURUMSAL GİRİŞ ---
  loginCorporate(email: string, password: string): Observable<AuthResponse> {
    // Backend email'den rolü anlıyor, ama RoleId gönderebiliriz (2 = Corporate)
    return this.login(email, password, 2);
  }

  // --- 3. TOPLULUK GİRİŞİ ---
  loginCommunity(email: string, password: string): Observable<AuthResponse> {
    // Backend email'den rolü anlıyor, ama RoleId gönderebiliriz (3 = Community)
    return this.login(email, password, 3);
  }

  // --- 4. KAYIT OL (REGISTER) ---
  // Swagger: POST /api/Auth/register
  registerStudent(fullName: string, email: string, password: string, roleId: number = 1): Observable<any> {
    // Backend tek bir register noktası sunuyor.
    const data: RegisterRequest = {
      FullName: fullName,
      Email: email,
      Password: password,
      RoleId: roleId
    };
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
