import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
// Servisler
import { ToastService } from '../../services/toast.services';
import { AuthService, LoginResponse } from '../../services/auth.services';
// Bileşenler
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
// Http Client
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ToastComponent, HttpClientModule, LumaSpinComponent],
  templateUrl: './community-login.html',
  styleUrls: ['./community-login.scss'],
  // BU SATIR EKLENMELİ: Spline gibi custom element'leri tanıması için gereklidir
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginPageComponent implements OnInit {
  emailError: boolean = false;
  isLoading: boolean = false;

  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
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
  }

  validateStudentEmail(event: any) {
    const email = event.target.value;

    if (!email) {
      this.emailError = false;
      return;
    }

    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.isLoading) return;

    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // 1. Validasyonlar
    if (!email || !password) {
      this.toastService.show('Lütfen e-posta ve şifre alanlarını doldurunuz.', 'error');
      return;
    }

    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir öğrenci e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    // 2. BACKEND SORGUSU BAŞLIYOR
    this.isLoading = true;

    this.authService.loginStudent(email, password).subscribe({
      next: (response: LoginResponse) => {
        // --- BAŞARILI GİRİŞ ---
        this.isLoading = false;
        this.toastService.show('Giriş başarılı! Anasayfaya yönlendiriliyorsunuz...', 'success');

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        // --- HATALI GİRİŞ ---
        this.isLoading = false;
        console.error('Giriş Hatası:', error);

        const message = error.error?.message || error.message || 'E-posta veya şifre hatalı!';
        this.toastService.show(message, 'error');
      },
    });
  }
}
