import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Servis ve UI Bileşenleri
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { AuthService } from '../../services/auth.services';
import { Logger } from '../../utils/logger.util';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent, LumaSpinComponent, FormsModule],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
})
export class RegisterPageComponent {
  emailError: boolean = false;
  passwordMismatch: boolean = false;
  isLoading: boolean = false;
  showTermsModal: boolean = false;
  showKvkkModal: boolean = false;
  /** Kullanıcı sözleşmesi ve KVKK onayı - işaretlenmeden kayıt yapılamaz */
  termsAccepted: boolean = false;

  /** Şifre güç kuralları (ekranda gösterim için) */
  passwordMinLength = false;
  passwordHasUppercase = false;
  passwordHasLowercase = false;
  passwordHasNumber = false;
  passwordHasSpecial = false;
  /** Şifre alanında en az bir karakter girildi mi (hata stilini göstermek için) */
  hasPasswordInput = false;

  private name: string = '';
  email: string = ''; // Public yapıldı - mail onay sayfasına gönderilecek
  private password: string = '';
  private confirmPassword: string = '';

  constructor(
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  updateName(event: any) {
    this.name = event.target.value;
  }

  validateStudentEmail(event: any) {
    const val = event.target.value;
    this.email = val;

    if (!val) {
      this.emailError = false;
      return;
    }
    if (val.includes('@') && !val.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
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

  checkPasswords(event: any, type: string) {
    const val = event.target.value;
    if (type === 'p1') {
      this.password = val;
      this.hasPasswordInput = val.length > 0;
      this.validatePasswordStrength(val);
    } else {
      this.confirmPassword = val;
    }

    this.passwordMismatch = !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // Kullanıcı sözleşmesi ve KVKK onayı zorunlu
    if (!this.termsAccepted) {
      this.toastService.show('Hesap oluşturmak için Kullanıcı Sözleşmesi ve KVKK\'yı okuduğunuzu onaylamanız gerekmektedir.', 'error');
      return;
    }

    // Validasyon Kontrolleri
    if (!this.name || !this.email || !this.password) {
      this.toastService.show('Lütfen tüm alanları doldurunuz.', 'error');
      return;
    }

    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir öğrenci e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    if (this.passwordMismatch) {
      this.toastService.show('Şifreler eşleşmiyor!', 'error');
      return;
    }

    if (!this.isPasswordStrong) {
      this.toastService.show(
        'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter (! . , ? @ # vb.) içermelidir.',
        'error'
      );
      return;
    }

    // Yükleniyor durumunu başlat (Spinner görünür)
    this.isLoading = true;

    // AuthService üzerinden kayıt işlemi
    this.authService
      .registerStudent({
        name: this.name,
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          Logger.log('Kayıt Başarılı:', response);

          // Backend: redirectUrl, message, email döner; token dönmez (e-posta doğrulama akışı)
          const message = response?.message || 'Doğrulama maili gönderildi. E-posta doğrulama sayfasına yönlendiriliyorsunuz...';
          this.toastService.show(message, 'success');

          const redirectUrl = response?.redirectUrl;
          if (redirectUrl) {
            try {
              const url = new URL(redirectUrl);
              if (url.origin === window.location.origin) {
                setTimeout(() => this.router.navigateByUrl(url.pathname + url.search), 800);
              } else {
                setTimeout(() => (window.location.href = redirectUrl), 800);
              }
            } catch {
              setTimeout(() => {
                this.router.navigate(['/email-verification-waiting'], {
                  queryParams: { email: response?.email ?? this.email }
                });
              }, 800);
            }
          } else {
            setTimeout(() => {
              this.router.navigate(['/email-verification-waiting'], {
                queryParams: { email: response?.email ?? this.email }
              });
            }, 800);
          }
        },
        error: (error: any) => {
          Logger.error('Kayıt Hatası:', error);
          this.isLoading = false;

          // Backend'den gelen hata mesajını göster
          const errorMessage =
            error?.error?.message ||
            error?.message ||
            'Kayıt sırasında bir hata oluştu.';
          this.toastService.show(errorMessage, 'error');
        },
      });
  }

  openTermsModal() {
    this.showTermsModal = true;
    // Modal açıldığında body scroll'unu engelle
    document.body.style.overflow = 'hidden';
  }

  closeTermsModal() {
    this.showTermsModal = false;
    // Modal kapandığında body scroll'unu tekrar etkinleştir
    document.body.style.overflow = '';
  }

  openKvkkModal() {
    this.showKvkkModal = true;
    // Modal açıldığında body scroll'unu engelle
    document.body.style.overflow = 'hidden';
  }

  closeKvkkModal() {
    this.showKvkkModal = false;
    // Modal kapandığında body scroll'unu tekrar etkinleştir
    document.body.style.overflow = '';
  }
}
