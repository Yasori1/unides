import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Servis ve UI Bileşenleri
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { AuthService } from '../../services/auth.services';

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

  private name: string = '';
  private email: string = '';
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

  checkPasswords(event: any, type: string) {
    const val = event.target.value;
    if (type === 'p1') this.password = val;
    else this.confirmPassword = val;

    this.passwordMismatch = !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  onSubmit(event: Event) {
    event.preventDefault();

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
          console.log('Kayıt Başarılı:', response);

          // BAŞARILI DURUM:
          // 1. Kullanıcıya bilgi ver
          this.toastService.show(
            'Kayıt işleminiz başarıyla tamamlandı! Giriş sayfasına yönlendiriliyorsunuz...',
            'success'
          );

          // 2. Yönlendirme yap (Kullanıcı mesajı okuyabilsin diye kısa bir gecikme ekledik)
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Kayıt Hatası:', error);
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
