import { Component, HostListener, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
// Servis importları
import { ToastService } from '../../services/toast.services';
import { AuthService } from '../../services/auth.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
// Spinner Bileşeni
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';

@Component({
  selector: 'app-corporate-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent, LumaSpinComponent, FormsModule],
  templateUrl: './corporate-login.html',
  styleUrls: ['./corporate-login.scss'],
})
export class CorporateLoginComponent implements OnInit, OnDestroy {
  emailError: boolean = false;
  isLoading: boolean = false;
  showForgotPasswordModal: boolean = false;
  forgotPasswordEmail: string = '';
  forgotEmailError: boolean = false;
  isSendingEmail: boolean = false;
  emailSent: boolean = false;
  private popStateListener?: (event: PopStateEvent) => void;

  constructor(
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    // SSR sırasında window kullanma, sadece browser'da çalıştır
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Geri butonuna basıldığında anasayfaya yönlendir
    this.popStateListener = (event: PopStateEvent) => {
      // State kontrolü yap - eğer bizim eklediğimiz state ise veya corporate-login sayfasındaysak
      if (
        (event.state && event.state.fromCorporateLogin) ||
        this.router.url === '/corporate-login'
      ) {
        // window.location kullanarak direkt anasayfaya yönlendir (Angular Router'ı bypass eder)
        if (isPlatformBrowser(this.platformId)) {
          window.location.href = '/';
        }
      }
    };

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('popstate', this.popStateListener);

      // History'ye bir entry ekle ki geri butonuna basıldığında popstate tetiklensin
      window.history.pushState({ fromCorporateLogin: true }, '', window.location.href);
    }
  }

  ngOnDestroy(): void {
    // SSR sırasında window kullanma
    if (isPlatformBrowser(this.platformId) && this.popStateListener) {
      window.removeEventListener('popstate', this.popStateListener);
    }
  }

  validateCorporateEmail(event: any) {
    const email = event.target.value;
    if (!email) {
      this.emailError = false;
      return;
    }
    // @ işaretinden sonra direkt gsb.gov.tr gelmeli
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || emailParts[1] !== 'gsb.gov.tr') {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;

    const email = emailInput?.value;
    const password = passwordInput?.value;

    if (!email || !password) {
      this.toastService.show('Lütfen e-posta ve şifre alanlarını doldurunuz.', 'error');
      return;
    }

    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir kurumsal e-posta (gsb.gov.tr) giriniz.', 'error');
      return;
    }

    // Yükleniyor durumunu başlat
    this.isLoading = true;

    this.authService.loginCorporate(email, password).subscribe({
      next: (response) => {
        // --- BAŞARILI ---
        // 1. Toast Mesajı
        this.toastService.show(
          'Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz...',
          'success'
        );

        // 2. Yönlendirme - Anasayfaya yönlendir
        setTimeout(() => {
          this.isLoading = false; // Spinner durur, yazı geri gelir
          this.router.navigateByUrl('/').catch((err) => {
            // Navigation hatası durumunda window.location kullan
            if (isPlatformBrowser(this.platformId)) {
              window.location.href = '/';
            }
          });
        }, 1500);
      },
      error: (error) => {
        // --- HATA ---

        // 1. Spinner'ı durdur, butonu eski haline getir
        this.isLoading = false;

        // 2. Özel Hata Mesajı
        const errorMessage =
          error.error?.message ||
          'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.';
        this.toastService.show(errorMessage, 'error');
      },
    });
  }

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
    if (!email) {
      this.forgotEmailError = false;
      return;
    }
    // Kurumsal giriş için gsb.gov.tr kontrolü
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || emailParts[1] !== 'gsb.gov.tr') {
      this.forgotEmailError = true;
    } else {
      this.forgotEmailError = false;
    }
  }

  async sendPasswordResetEmail() {
    if (!this.forgotPasswordEmail || this.forgotEmailError) {
      this.toastService.show('Lütfen geçerli bir kurumsal e-posta (gsb.gov.tr) giriniz.', 'error');
      return;
    }

    this.isSendingEmail = true;
    this.emailSent = false;

    try {
      const response = await fetch('/api/Auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.forgotPasswordEmail.trim(),
        }),
      });

      // Response'un JSON olup olmadığını kontrol et
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.toastService.show('Sunucuya Bağlanılamadı', 'error');
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
        // Mail bulunamadı kontrolü
        const errorMessage = data.message || '';
        const lowerMessage = errorMessage.toLowerCase();

        if (
          response.status === 404 ||
          lowerMessage.includes('not found') ||
          lowerMessage.includes('bulunamadı') ||
          lowerMessage.includes('kullanıcı bulunamadı') ||
          lowerMessage.includes('email not found') ||
          lowerMessage.includes('e-posta bulunamadı')
        ) {
          this.toastService.show('Mail bulunamadı', 'error');
        } else if (errorMessage) {
          this.toastService.show(errorMessage, 'error');
        } else {
          this.toastService.show('Bir hata oluştu. Lütfen tekrar deneyiniz.', 'error');
        }
      }
    } catch (error: any) {
      // Network hatası veya fetch hatası
      if (error.message && error.message.includes('fetch')) {
        this.toastService.show('Sunucuya Bağlanılamadı', 'error');
      } else {
        this.toastService.show('Sunucuya Bağlanılamadı', 'error');
      }
    } finally {
      this.isSendingEmail = false;
    }
  }
}
