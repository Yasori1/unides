import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Router Eklendi
// Servisler
import { ToastService } from '../../services/toast.services';
import { AuthService } from '../../services/auth.services'; // Auth Servisi Eklendi
// Bileşenler
import { ToastComponent } from '../../components/ui/toast/toast.component';
// Http Client Modülü (Standalone component içinde http kullanabilmek için gerekebilir)
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login-page',
  standalone: true,
  // HttpClientModule'ü buraya ekliyoruz ki servis çalışsın
  imports: [CommonModule, RouterLink, ToastComponent, HttpClientModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginPageComponent implements OnInit {
  emailError: boolean = false;
  isLoading: boolean = false; // Yükleniyor durumu için (Butonu pasif yapmak için)

  constructor(
    private toastService: ToastService,
    private authService: AuthService, // Auth servisini çağırıyoruz
    private router: Router // Yönlendirme için
  ) {}

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

    if (this.isLoading) return; // Zaten işlem yapılıyorsa tekrar basılmasın

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
    this.isLoading = true; // Butonu kilitle
    // ARA BİLDİRİM KALDIRILDI: Artık sorgu bitene kadar sessizce bekleyecek.

    this.authService.login(email, password).subscribe({
      next: (response) => {
        // --- BAŞARILI GİRİŞ ---
        this.isLoading = false;

        // Token'ı kaydet
        this.authService.saveToken(response.token);

        this.toastService.show('Giriş başarılı! Anasayfaya yönlendiriliyorsunuz...', 'success');

        // 1.5 saniye sonra yönlendir (Toast okunsun diye)
        setTimeout(() => {
          this.router.navigate(['/']); // Anasayfaya git
        }, 1500);
      },
      error: (error) => {
        // --- HATALI GİRİŞ ---
        this.isLoading = false;
        console.error('Giriş Hatası:', error);

        // Backend'den gelen hata mesajını veya genel bir mesajı göster
        const message = error.message || 'E-posta veya şifre hatalı!';
        this.toastService.show(message, 'error');
      },
    });
  }
}
