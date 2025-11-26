import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterRequest } from '../../services/auth.services';

// Servis ve UI Bileşenleri
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent, LumaSpinComponent],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
})
export class RegisterPageComponent {
  emailError: boolean = false;
  passwordMismatch: boolean = false;
  isLoading: boolean = false;

  private name: string = '';
  private email: string = '';
  private password: string = '';
  private confirmPassword: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
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

    const requestData: RegisterRequest = {
      name: this.name,
      email: this.email,
      password: this.password,
    };

    this.authService.registerStudent(requestData).subscribe({
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
          // isLoading false yapmaya gerek yok çünkü sayfa değişecek
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Kayıt Hatası:', error);

        // BAŞARISIZ DURUM:
        // 1. Spinner'ı kapat, butonu geri getir
        this.isLoading = false;

        // 2. Hatayı göster
        const errorMessage = error.error?.message || 'Kayıt sırasında bir hata oluştu.';
        this.toastService.show(errorMessage, 'error');

        // 3. Yönlendirme YAPMA (Kullanıcı sayfada kalır ve tekrar deneyebilir)
      },
    });
  }
}
