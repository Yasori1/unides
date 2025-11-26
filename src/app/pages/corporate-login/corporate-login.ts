import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
// Servis importları
import { ToastService } from '../../services/toast.services';
import { AuthService } from '../../services/auth.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
// Spinner Bileşeni
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';

@Component({
  selector: 'app-corporate-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent, LumaSpinComponent],
  templateUrl: './corporate-login.html',
  styleUrls: ['./corporate-login.scss'],
})
export class CorporateLoginComponent {
  emailError: boolean = false;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  validateStudentEmail(event: any) {
    const email = event.target.value;
    if (!email) {
      this.emailError = false;
      return;
    }
    if (email.includes('@')) {
      this.emailError = false;
    } else {
      this.emailError = true;
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
      this.toastService.show('Lütfen geçerli bir kurumsal e-posta giriniz.', 'error');
      return;
    }

    // Yükleniyor durumunu başlat
    this.isLoading = true;

    this.authService.loginCorporate(email, password).subscribe({
      next: (response) => {
        // --- BAŞARILI ---
        console.log('Kurumsal giriş başarılı:', response);

        // 1. Toast Mesajı
        this.toastService.show(
          'Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz...',
          'success'
        );

        // 2. Yönlendirme ve Buton Durumu
        setTimeout(() => {
          this.isLoading = false; // Spinner durur, yazı geri gelir
          this.router.navigate(['/corporate-dashboard']); // Yönlendirme
        }, 1500);
      },
      error: (error) => {
        // --- HATA ---
        console.error('Giriş Hatası:', error);

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
}
