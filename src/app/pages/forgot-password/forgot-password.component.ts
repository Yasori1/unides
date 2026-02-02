import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { Logger } from '../../utils/logger.util';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToastComponent, LumaSpinComponent],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ForgotPasswordComponent implements OnInit {
  email: string = '';
  emailError: boolean = false;
  isLoading: boolean = false;
  emailSent: boolean = false;

  constructor(
    private router: Router,
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
  }

  validateStudentEmail(event: any) {
    const email = event.target.value;
    this.email = email;

    // Eğer input boşsa hatayı temizle
    if (!email) {
      this.emailError = false;
      return;
    }

    // E-posta format kontrolü: .edu.tr ile bitmeli
    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  async sendPasswordResetEmail() {
    // Validasyonlar
    if (!this.email) {
      this.toastService.show('Lütfen e-posta adresinizi giriniz.', 'error');
      return;
    }

    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir öğrenci e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    // Backend'e istek gönder
    this.isLoading = true;
    this.emailSent = false;

    try {
      // POST /api/auth/forgot-password — Body: { "email": "..." }
      const response = await fetch(`${environment.apiUrl}/Auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email.trim(),
        }),
      });

      // Response'un JSON olup olmadığını kontrol et
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.isLoading = false;
        this.toastService.show('Sunucuya bağlanılamadı. Lütfen tekrar deneyiniz.', 'error');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        this.emailSent = true;
        const message = data?.message || 'E-posta adresinize şifre sıfırlama bağlantısı gönderildi. Gelen kutusu ve gereksiz klasörünü kontrol edin.';
        this.toastService.show(message, 'success');
        // İsteğe bağlı: 3 saniye sonra login sayfasına yönlendir (dökümana göre zorunlu değil)
        setTimeout(() => this.router.navigate(['/login']), 3000);
      } else {
        this.isLoading = false;
        const errorMessage = data?.message || '';
        const lowerMessage = errorMessage.toLowerCase();

        // Mail bulunamadı kontrolü
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
      Logger.error('Şifre sıfırlama hatası:', error);
      this.isLoading = false;
      this.toastService.show('Sunucuya bağlanılamadı. Lütfen tekrar deneyiniz.', 'error');
    }
  }
}
