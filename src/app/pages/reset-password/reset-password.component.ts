import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { Logger } from '../../utils/logger.util';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToastComponent, LumaSpinComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  passwordError: boolean = false;
  confirmPasswordError: boolean = false;
  isLoading: boolean = false;

  /** Şifre güç kuralları (ekranda gösterim için) */
  passwordMinLength = false;
  passwordHasUppercase = false;
  passwordHasLowercase = false;
  passwordHasNumber = false;
  passwordHasSpecial = false;
  hasPasswordInput = false;

  private redirectTimeout?: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    // URL'den token'ı al:
    // 1) Önce window.location.search içindeki ?token= query parametresine bak
    // 2) Eğer yoksa window.location.hash içindeki #token=... formatından token'ı çek
    // 3) Son çare olarak Angular route query/route params'ı kullan
    this.token = this.getTokenFromUrl() ||
      this.route.snapshot.queryParams['token'] ||
      this.route.snapshot.params['token'] ||
      '';

    // Token yoksa bir kez kontrol et ve yönlendir (sürekli yönlendirme yapma)
    if (!this.token) {
      // Kısa bir gecikme ile kontrol et (bazı durumlarda params geç yüklenebilir)
      setTimeout(() => {
        // Tekrar kontrol et - önce window.location üzerinden, sonra Angular route üzerinden
        const retryToken = this.getTokenFromUrl() ||
          this.route.snapshot.queryParams['token'] ||
          this.route.snapshot.params['token'] ||
          '';
        if (retryToken) {
          this.token = retryToken;
        } else {
          // Token hala yoksa yönlendir (sadece bir kez)
          if (!this.redirectTimeout) {
            this.toastService.show('Geçersiz veya eksik şifre sıfırlama linki.', 'error');
            this.redirectTimeout = setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          }
        }
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Timeout'u temizle
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  /**
   * URL'den token'ı okur.
   * Öncelik sırası:
   * 1) window.location.search içindeki ?token=
   * 2) window.location.hash içindeki #token=...
   */
  private getTokenFromUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    // Query parametrelerinden token
    const searchParams = new URLSearchParams(window.location.search || '');
    const queryToken = searchParams.get('token');
    if (queryToken) {
      return queryToken;
    }

    // Hash fragment (#token=XYZ) içinden token
    const rawHash = window.location.hash || '';
    const hashWithoutSharp = rawHash.startsWith('#') ? rawHash.substring(1) : rawHash;
    const hashParams = new URLSearchParams(hashWithoutSharp);
    const hashToken = hashParams.get('token');

    return hashToken || '';
  }

  /** Şifre güç kurallarını kontrol et */
  private validatePasswordStrength(pwd: string): void {
    this.passwordMinLength = pwd.length >= 8;
    this.passwordHasUppercase = /[A-Z]/.test(pwd);
    this.passwordHasLowercase = /[a-z]/.test(pwd);
    this.passwordHasNumber = /[0-9]/.test(pwd);
    this.passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?.]/.test(pwd);
  }

  /** Tüm şifre kuralları sağlanıyor mu? */
  get isPasswordStrong(): boolean {
    return (
      this.passwordMinLength &&
      this.passwordHasUppercase &&
      this.passwordHasLowercase &&
      this.passwordHasNumber &&
      this.passwordHasSpecial
    );
  }

  validatePassword(event: any) {
    const password = event.target.value;
    this.newPassword = password;
    this.hasPasswordInput = password.length > 0;
    this.validatePasswordStrength(password);
    this.passwordError = this.hasPasswordInput && !this.isPasswordStrong;
    this.validateConfirmPassword();
  }

  validateConfirmPassword() {
    if (!this.confirmPassword) {
      this.confirmPasswordError = false;
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError = true;
    } else {
      this.confirmPasswordError = false;
    }
  }

  async resetPassword() {
    // Validasyonlar
    if (!this.newPassword || !this.confirmPassword) {
      this.toastService.show('Lütfen tüm alanları doldurunuz.', 'error');
      return;
    }

    if (!this.isPasswordStrong) {
      this.toastService.show(
        'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter (! . , ? @ # vb.) içermelidir.',
        'error'
      );
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastService.show('Şifreler eşleşmiyor.', 'error');
      return;
    }

    if (!this.token) {
      this.toastService.show('Geçersiz şifre sıfırlama linki.', 'error');
      return;
    }

    this.isLoading = true;

    try {
      const response = await fetch(`${environment.apiUrl}/Auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.token,
          newPassword: this.newPassword,
          confirmNewPassword: this.confirmPassword,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend sunucusuna bağlanılamıyor...');
      }

      const data = await response.json();

      if (response.ok) {
        const message = data.message || 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.';
        this.toastService.show(message, 'success');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      } else {
        const errorMessage = data.message || 'Şifre sıfırlama işlemi başarısız oldu.';
        this.toastService.show(errorMessage, 'error');
      }
    } catch (error: any) {
      Logger.error('Şifre sıfırlama hatası:', error);
      this.toastService.show(
        error.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.',
        'error'
      );
    } finally {
      this.isLoading = false;
    }
  }
}

