import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'corporate' | 'community' | 'admin';
  };
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
  private apiUrl = 'https://api.unides.com/api';

  constructor(private http: HttpClient, private router: Router) {}

  // --- 1. ÖĞRENCİ GİRİŞİ ---
  loginStudent(email: string, password: string): Observable<LoginResponse> {
    const payload = { email, password };
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/student/login`, payload).pipe(
      tap((response) => {
        if (response.token) {
          this.saveToken(response.token);
          this.saveUser(response.user);
          this.saveUserType('student');
        }
      })
    );
  }

  // --- 2. KURUMSAL GİRİŞ ---
  loginCorporate(email: string, password: string): Observable<LoginResponse> {
    const payload = { email, password };
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/corporate/login`, payload).pipe(
      tap((response) => {
        if (response.token) {
          this.saveToken(response.token);
          this.saveUser(response.user);
          this.saveUserType('corporate');
        }
      })
    );
  }

  // --- 3. TOPLULUK GİRİŞİ (YENİ EKLENDİ) ---
  loginCommunity(email: string, password: string): Observable<LoginResponse> {
    const payload = { email, password };
    // Backend endpoint varsayımı: /auth/community/login
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/community/login`, payload).pipe(
      tap((response) => {
        if (response.token) {
          this.saveToken(response.token);
          this.saveUser(response.user);
          this.saveUserType('community');
        }
      })
    );
  }

  // --- 4. ÖĞRENCİ KAYDI ---
  registerStudent(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/student/register`, data);
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
