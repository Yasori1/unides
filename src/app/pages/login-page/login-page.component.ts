import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
// Servisler
import { ToastService } from '../../services/toast.services';
// Bileşenler
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';

// Backend Response Interface
interface AuthResponse {
  id: number;
  fullName: string;
  email: string;
  roleName: string;
  accessToken: string;
  refreshToken: string;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToastComponent, LumaSpinComponent],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginPageComponent implements OnInit {
  emailError: boolean = false;
  email: string = '';
  password: string = '';
  roleId: number = 1; // öğrenci
  isLoading: boolean = false;
  loginError: string = '';

  // Şifremi Unuttum Modal
  showForgotPasswordModal: boolean = false;
  forgotPasswordEmail: string = '';
  forgotEmailError: boolean = false;
  isSendingEmail: boolean = false;
  emailSent: boolean = false;

  constructor(
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const scriptCheck = document.querySelector(
      'script[src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"]'
    );

    if (!scriptCheck) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
      document.head.appendChild(script);
    }
  }

  validateStudentEmail(event: any) {
    const email = event.target.value;
    this.email = email;

    // Eğer input boşsa hatayı temizle
    if (!email) {
      this.emailError = false;
      return;
    }

    // E-posta format kontrolü:
    // 1. İçinde @ işareti olmalı
    // 2. Sonu .edu.tr ile bitmeli
    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.isLoading) return;

    // Form'dan değerleri al
    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;

    this.email = emailInput?.value.trim() || this.email;
    this.password = passwordInput?.value.trim() || this.password;

    // 1. Validasyonlar
    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir öğrenci e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    if (!this.email || !this.password) {
      this.toastService.show('E-posta ve şifre zorunludur.', 'error');
      return;
    }

    // 2. BACKEND SORGUSU BAŞLIYOR
    this.isLoading = true;
    this.loginError = '';

    fetch('/api/Auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.email,
        password: this.password,
        roleId: this.roleId // 1 = Öğrenci
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const message = err?.message || `HTTP ${res.status}`;
          throw new Error(message);
        }
        return res.json();
      })
      .then((data: AuthResponse) => {
        // --- BAŞARILI GİRİŞ ---
        // Token'ı localStorage'a kaydet
        if (data.accessToken) {
          localStorage.setItem('auth_token', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refresh_token', data.refreshToken);
        }
        // Kullanıcı bilgilerini kaydet
        localStorage.setItem('user_info', JSON.stringify({
          id: data.id,
          name: data.fullName,
          email: data.email,
          role: data.roleName
        }));
        localStorage.setItem('user_type', 'student');

        this.toastService.show('Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz...', 'success');

        setTimeout(() => {
          this.router.navigateByUrl('/');
        }, 1500);
      })
      .catch((e: any) => {
        // --- HATALI GİRİŞ ---
        this.loginError = e?.message || 'Giriş başarısız';
        console.error('Giriş Hatası:', e);
        this.toastService.show(this.loginError, 'error');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  // Şifremi Unuttum Modal Fonksiyonları
  openForgotPasswordModal() {
    this.showForgotPasswordModal = true;
    this.forgotPasswordEmail = '';
    this.forgotEmailError = false;
    this.emailSent = false;
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal = false;
    this.forgotPasswordEmail = '';
    this.forgotEmailError = false;
    this.emailSent = false;
  }

  validateForgotEmail(event: any) {
    const email = event.target.value;
    this.forgotPasswordEmail = email;

    if (!email) {
      this.forgotEmailError = false;
      return;
    }

    // E-posta format kontrolü: .edu.tr ile bitmeli
    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.forgotEmailError = true;
    } else {
      this.forgotEmailError = false;
    }
  }

  async sendPasswordResetEmail() {
    if (!this.forgotPasswordEmail || this.forgotEmailError) {
      this.toastService.show('Lütfen geçerli bir öğrenci e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    this.isSendingEmail = true;
    this.emailSent = false;

    try {
      // NOT: Backend endpoint şu an yok ama kodlar hazır, endpoint eklendiğinde çalışacak
      const response = await fetch('/api/Auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.forgotPasswordEmail.trim(),
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.isSendingEmail = false;
        this.toastService.show('Sunucuya bağlanılamadı. Lütfen tekrar deneyiniz.', 'error');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        this.emailSent = true;
        this.toastService.show('Şifre sıfırlama linki e-posta adresinize gönderildi.', 'success');
        setTimeout(() => {
          this.closeForgotPasswordModal();
        }, 3000);
      } else {
        this.isSendingEmail = false;
        const errorMessage = data?.message || '';
        const lowerMessage = errorMessage.toLowerCase();

        if (
          response.status === 404 ||
          lowerMessage.includes('not found') ||
          lowerMessage.includes('bulunamadı') ||
          lowerMessage.includes('kullanıcı bulunamadı') ||
          lowerMessage.includes('email not found') ||
          lowerMessage.includes('e-posta bulunamadı')
        ) {
          this.toastService.show('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.', 'error');
        } else if (errorMessage) {
          this.toastService.show(errorMessage, 'error');
        } else {
          this.toastService.show('Bir hata oluştu. Lütfen tekrar deneyiniz.', 'error');
        }
      }
    } catch (error: any) {
      console.error('Şifre sıfırlama hatası:', error);
      this.isSendingEmail = false;
      this.toastService.show('Sunucuya bağlanılamadı. Lütfen tekrar deneyiniz.', 'error');
    }
  }
}