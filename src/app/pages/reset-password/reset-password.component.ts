import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToastComponent, LumaSpinComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  passwordError: boolean = false;
  confirmPasswordError: boolean = false;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Spline Viewer scriptini dinamik olarak yükle
    const scriptCheck = document.querySelector(
      'script[src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"]'
    );

    if (!scriptCheck) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
      document.head.appendChild(script);
    }

    // URL'den token'ı al
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.toastService.show('Geçersiz veya eksik şifre sıfırlama linki.', 'error');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      }
    });
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
      const response = await fetch('/api/Auth/reset-password', {
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
      console.error('Şifre sıfırlama hatası:', error);
      this.toastService.show(
        error.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.',
        'error'
      );
    } finally {
      this.isLoading = false;
    }
  }
}

