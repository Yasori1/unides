import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.services';
import { AuthService } from '../../services/auth.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { PasswordStrengthMeterComponent } from '../../components/ui/password-strength-meter/password-strength-meter.component';
import { checkPasswordStrength } from '../../utils/password-strength.utils';
import { sanitizeUserInput, sanitizeEmail } from '../../utils/input-sanitization.utils';

@Component({
  selector: 'app-community-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ToastComponent, LumaSpinComponent, PasswordStrengthMeterComponent],
  templateUrl: './community-register.html',
  styleUrls: ['./community-register.scss'],
})
export class CommunityRegisterComponent {
  passwordMismatch: boolean = false;
  isLoading: boolean = false;
  emailError: boolean = false;

  private communityName: string = '';
  private university: string = '';
  private fullName: string = '';
  private email: string = '';
  password: string = ''; // public for template binding
  private confirmPassword: string = '';

  constructor(
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService
  ) { }

  updateCommunityName(event: any) {
    this.communityName = event.target.value;
  }

  updateUniversity(event: any) {
    this.university = event.target.value;
  }

  updateFullName(event: any) {
    this.fullName = event.target.value;
  }

  validateCommunityEmail(event: any) {
    const email = event.target.value;
    this.email = email;

    if (!email) {
      this.emailError = false;
      return;
    }

    // Topluluk e-posta kontrolü: .edu.tr ile bitmeli
    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  checkPasswords(event: any, type: string) {
    const val = event.target.value;
    if (type === 'p1') this.password = val;
    else this.confirmPassword = val;
    this.passwordMismatch =
      this.confirmPassword && this.password !== this.confirmPassword ? true : false;
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    // Validasyonlar
    if (!this.communityName || !this.university || !this.fullName || !this.email || !this.password) {
      this.toastService.show('Lütfen tüm alanları doldurunuz.', 'error');
      return;
    }

    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir topluluk e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    if (this.passwordMismatch) {
      this.toastService.show('Şifreler eşleşmiyor!', 'error');
      return;
    }

    // Şifre gücü kontrolü
    const passwordStrength = checkPasswordStrength(this.password);
    if (!passwordStrength.isValid) {
      this.toastService.show('Şifre en az 8 karakter, büyük harf, küçük harf ve rakam içermelidir.', 'error');
      return;
    }

    // Backend'e kayıt isteği
    this.isLoading = true;

    try {
      const response = await fetch('/api/Auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          communityName: sanitizeUserInput(this.communityName),
          university: sanitizeUserInput(this.university),
          fullName: sanitizeUserInput(this.fullName),
          email: sanitizeEmail(this.email),
          password: this.password,
          roleId: 3 // 3 = Topluluk
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.isLoading = false;
        this.toastService.show(
          "Backend'den beklenmeyen yanıt alındı. Lütfen backend servisinin çalıştığından emin olun.",
          'error'
        );
        return;
      }

      const data = await response.json();

      if (response.ok) {
        this.toastService.show(
          'Kayıt işleminiz başarıyla tamamlandı! Giriş sayfasına yönlendiriliyorsunuz...',
          'success'
        );

        setTimeout(() => {
          this.router.navigate(['/community-login']);
        }, 2000);
      } else {
        this.isLoading = false;
        const errorMessage = data?.message || 'Kayıt sırasında bir hata oluştu.';
        this.toastService.show(errorMessage, 'error');
      }
    } catch (error: any) {
      this.isLoading = false;
      const message = error?.message || 'Kayıt sırasında bir hata oluştu.';
      this.toastService.show(message, 'error');
    }
  }
}
