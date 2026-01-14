import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.services';
import { Subject } from 'rxjs';

/**
 * AFK (Away From Keyboard) Detection Service
 * Kullanıcı 10 dakika boyunca hiçbir etkileşim yapmazsa otomatik logout yapar
 */
@Injectable({
  providedIn: 'root',
})
export class AfkDetectionService implements OnDestroy {
  private readonly AFK_TIMEOUT = 10 * 60 * 1000; // 10 dakika (milisaniye)
  private inactivityTimer: any = null;
  private isActive = false;
  private lastActivityTime: number = Date.now();

  // AFK durumu değiştiğinde bildirim için
  public onAfkDetected = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private authService: AuthService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.setupEventListeners();
    }
  }

  /**
   * AFK detection'ı başlat
   */
  start(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.isActive) {
      this.stop(); // Eğer zaten aktifse önce durdur
    }

    this.isActive = true;
    this.resetTimer();
    this.setupEventListeners();
  }

  /**
   * AFK detection'ı durdur
   */
  stop(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    this.isActive = false;
    this.removeEventListeners();
  }

  /**
   * Timer'ı sıfırla (kullanıcı etkileşim yaptığında çağrılır)
   */
  resetTimer(): void {
    if (!isPlatformBrowser(this.platformId) || !this.isActive) return;

    // Mevcut timer'ı temizle
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    // Son aktivite zamanını güncelle
    this.lastActivityTime = Date.now();

    // Yeni timer başlat
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.AFK_TIMEOUT);
  }

  /**
   * Kullanıcı etkileşim yaptığında çağrılır
   */
  private onUserActivity(): void {
    if (!this.isActive) return;
    this.resetTimer();
  }

  /**
   * Etkinlik dinleyicilerini kur
   */
  private setupEventListeners(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Mouse hareketi
    document.addEventListener('mousemove', this.onUserActivity.bind(this), { passive: true });
    // Mouse tıklaması
    document.addEventListener('mousedown', this.onUserActivity.bind(this), { passive: true });
    // Klavye tuşları
    document.addEventListener('keydown', this.onUserActivity.bind(this), { passive: true });
    // Scroll
    document.addEventListener('scroll', this.onUserActivity.bind(this), { passive: true });
    // Touch (mobil)
    document.addEventListener('touchstart', this.onUserActivity.bind(this), { passive: true });
    document.addEventListener('touchmove', this.onUserActivity.bind(this), { passive: true });
  }

  /**
   * Etkinlik dinleyicilerini kaldır
   */
  private removeEventListeners(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    document.removeEventListener('mousemove', this.onUserActivity.bind(this));
    document.removeEventListener('mousedown', this.onUserActivity.bind(this));
    document.removeEventListener('keydown', this.onUserActivity.bind(this));
    document.removeEventListener('scroll', this.onUserActivity.bind(this));
    document.removeEventListener('touchstart', this.onUserActivity.bind(this));
    document.removeEventListener('touchmove', this.onUserActivity.bind(this));
  }

  /**
   * Kullanıcı inaktif kaldığında çağrılır
   */
  private handleInactivity(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Kullanıcı hala giriş yapmış mı kontrol et
    if (!this.authService.isAuthenticated()) {
      return; // Zaten çıkış yapılmış
    }

    // AFK tespit edildi - logout yap
    console.log('AFK tespit edildi - otomatik logout yapılıyor...');
    this.onAfkDetected.next();

    // Logout yap
    this.authService.logout();

    // Router navigate zaten AuthService'de yapılıyor, ama emin olmak için
    this.router.navigate(['/']).catch(() => {
      // Hata durumunda window.location kullan
      if (isPlatformBrowser(this.platformId)) {
        window.location.href = '/';
      }
    });
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
