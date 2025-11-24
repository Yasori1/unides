import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Backend isteği için
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Backend API Adresiniz (Burası değişecek)
  private apiUrl = 'https://api.unides.com.tr/api/v1';

  // HttpClient'ı inject ediyoruz (app.config.ts'de provideHttpClient() olmalı)
  constructor(private http: HttpClient) {}

  /**
   * GİRİŞ YAPMA FONKSİYONU
   * @param email Öğrenci E-postası
   * @param password Şifre
   */
  login(email: string, password: string): Observable<any> {
    // --- SENARYO 1: GERÇEK BACKEND (Backend hazır olunca burayı açın) ---
    /*
    return this.http.post(`${this.apiUrl}/auth/login`, { 
      email: email, 
      password: password 
    });
    */

    // --- SENARYO 2: DEMO / SİMÜLASYON (Şu an çalışan) ---
    // Backend varmış gibi 1 saniye bekletip cevap döner.
    return new Observable((observer) => {
      setTimeout(() => {
        if (email === 'demo@univ.edu.tr' && password === '123456') {
          // Başarılı Cevap Simülasyonu
          observer.next({
            success: true,
            token: 'fake-jwt-token-123456',
            user: { name: 'Öğrenci', email: email },
          });
          observer.complete();
        } else {
          // Hatalı Cevap Simülasyonu
          observer.error({ status: 401, message: 'E-posta veya şifre hatalı.' });
        }
      }, 1000); // 1 saniye gecikme
    });
  }

  /**
   * TOKEN KAYDETME (Giriş başarılıysa token'ı tarayıcıya kaydeder)
   */
  saveToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  /**
   * ÇIKIŞ YAPMA
   */
  logout() {
    localStorage.removeItem('auth_token');
  }
}
