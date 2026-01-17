import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface TokenInfo {
  token: string;
  expiryTime: number; // Unix timestamp (milliseconds)
  issuedAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class TokenExpiryService {
  private tokenExpirySubject = new BehaviorSubject<number | null>(null);
  public tokenExpiry$ = this.tokenExpirySubject.asObservable();

  private checkInterval: Subscription | null = null;
  private readonly CHECK_INTERVAL_MS = 60000; // 1 dakikada bir kontrol et
  private readonly WARNING_THRESHOLD_MS = 5 * 60 * 1000; // Son 5 dakika için uyarı

  constructor() {
    this.startMonitoring();
  }

  /**
   * Token'dan expiry bilgisini çıkarır
   */
  private decodeToken(token: string): TokenInfo | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);

      return {
        token,
        expiryTime: payload.exp ? payload.exp * 1000 : 0, // Unix timestamp'i ms'ye çevir
        issuedAt: payload.iat ? payload.iat * 1000 : Date.now(),
      };
    } catch (error) {
      console.error('Token decode hatası:', error);
      return null;
    }
  }

  /**
   * Token'ın süresini kontrol eder
   */
  public getTokenExpiry(token: string | null): number | null {
    if (!token) return null;

    const tokenInfo = this.decodeToken(token);
    if (!tokenInfo) return null;

    return tokenInfo.expiryTime;
  }

  /**
   * Token'ın geçerli olup olmadığını kontrol eder
   */
  public isTokenValid(token: string | null): boolean {
    if (!token) return false;

    const expiryTime = this.getTokenExpiry(token);
    if (!expiryTime) return false;

    return Date.now() < expiryTime;
  }

  /**
   * Token'ın kaç ms sonra süresinin dolacağını döner
   */
  public getTimeUntilExpiry(token: string | null): number | null {
    if (!token) return null;

    const expiryTime = this.getTokenExpiry(token);
    if (!expiryTime) return null;

    const timeLeft = expiryTime - Date.now();
    return timeLeft > 0 ? timeLeft : 0;
  }

  /**
   * Token'ın yakında süresinin dolup dolmayacağını kontrol eder
   */
  public isTokenExpiringSoon(token: string | null, thresholdMs: number = this.WARNING_THRESHOLD_MS): boolean {
    const timeLeft = this.getTimeUntilExpiry(token);
    if (timeLeft === null) return false;

    return timeLeft > 0 && timeLeft <= thresholdMs;
  }

  /**
   * Token monitoring başlat
   */
  private startMonitoring(): void {
    // Her 1 dakikada bir token kontrolü yap
    this.checkInterval = interval(this.CHECK_INTERVAL_MS).subscribe(() => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const expiryTime = this.getTokenExpiry(token);
          this.tokenExpirySubject.next(expiryTime);
        } else {
          this.tokenExpirySubject.next(null);
        }
      }
    });
  }

  /**
   * Service destroy olduğunda interval'i temizle
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
      this.checkInterval = null;
    }
  }

  /**
   * Token'ın yenilenmeye ihtiyacı olup olmadığını kontrol eder
   * Token'ın ömrünün %20'sinden azı kaldıysa yenilenmeli
   */
  public shouldRefreshToken(token: string | null): boolean {
    if (!token) return false;

    const tokenInfo = this.decodeToken(token);
    if (!tokenInfo) return false;

    const totalLifetime = tokenInfo.expiryTime - tokenInfo.issuedAt;
    const timeLeft = tokenInfo.expiryTime - Date.now();

    // Token'ın ömrünün %20'sinden azı kaldıysa yenile
    // Örnek: 60 dakikalık token için son 12 dakikada yenile
    return timeLeft > 0 && timeLeft < totalLifetime * 0.2;
  }
}
