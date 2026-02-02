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
  private redirectTimeout?: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    // URL'den token'ı al - hem query params hem route params'tan kontrol et
    this.token = this.route.snapshot.queryParams['token'] ||
      this.route.snapshot.params['token'] ||
      '';

    // Token yoksa bir kez kontrol et ve yönlendir (sürekli yönlendirme yapma)
    if (!this.token) {
      // Kısa bir gecikme ile kontrol et (bazı durumlarda params geç yüklenebilir)
      setTimeout(() => {
        // Tekrar kontrol et - hem query hem route params
        const retryToken = this.route.snapshot.queryParams['token'] ||
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

  validatePassword(event: any) {
    const password = event.target.value;
    if (!password) {
      this.passwordError = false;
      return;
    }
    // Şifre en az 6 karakter olmalı
    if (password.length < 6) {
      this.passwordError = true;
    } else {
      this.passwordError = false;
    }
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

    if (this.passwordError) {
      this.toastService.show('Şifre en az 6 karakter olmalıdır.', 'error');
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
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend sunucusuna bağlanılamıyor...');
      }

      const data = await response.json();

      if (response.ok) {
        this.toastService.show('Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
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

