import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
// Servisler ve Bileşenler
import { ToastService } from '../../services/toast.services';
import { AuthService } from '../../services/auth.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';

@Component({
  selector: 'app-community-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent, LumaSpinComponent],
  templateUrl: './community-login.html',
  styleUrls: ['./community-login.scss'],
})
export class CommunityLoginComponent {
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
    // Topluluklar için basit e-posta formatı kontrolü
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

    // 1. Boş Alan Kontrolü
    if (!email || !password) {
      this.toastService.show('Lütfen e-posta ve şifre alanlarını doldurunuz.', 'error');
      return;
    }

    // 2. Validasyon Kontrolü
    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir e-posta adresi giriniz.', 'error');
      return;
    }

    // 3. Giriş İşlemi
    this.isLoading = true;

    this.authService.loginCommunity(email, password).subscribe({
      next: (response) => {
        // --- BAŞARILI ---
        console.log('Topluluk girişi başarılı:', response);
        this.toastService.show(
          'Giriş başarılı! Topluluk paneline yönlendiriliyorsunuz...',
          'success'
        );

        setTimeout(() => {
          this.isLoading = false;
          // Topluluk Dashboard'una yönlendir (Henüz yoksa oluşturacağız)
          this.router.navigate(['/community-dashboard']);
        }, 1500);
      },
      error: (error) => {
        // --- HATA ---
        console.error('Giriş Hatası:', error);
        this.isLoading = false;

        const errorMessage =
          error.error?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.';
        this.toastService.show(errorMessage, 'error');
      },
    });
  }
}
