import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// Toast Servis ve Component'i Import Ediyoruz
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent], // ToastComponent'i eklemeyi unutmayın
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
})
export class RegisterPageComponent {
  emailError: boolean = false;
  passwordMismatch: boolean = false;

  private password = '';
  private confirmPassword = '';

  // Toast Servisini Enjekte Ediyoruz
  constructor(private toastService: ToastService) {}

  // Sadece numara girilmesine izin verir
  onlyNumbers(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  // Öğrenci E-posta Doğrulama
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

  // Şifre Eşleşme Kontrolü
  checkPasswords(event: any, type: string) {
    const val = event.target.value;

    if (type === 'p1') {
      this.password = val;
    } else {
      this.confirmPassword = val;
    }

    if (this.confirmPassword && this.password !== this.confirmPassword) {
      this.passwordMismatch = true;
    } else {
      this.passwordMismatch = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.emailError) {
      // Hata Mesajı
      this.toastService.show('Lütfen geçerli bir öğrenci e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    if (this.passwordMismatch) {
      // Hata Mesajı
      this.toastService.show('Şifreler eşleşmiyor! Lütfen kontrol edin.', 'error');
      return;
    }

    // --- BAŞARILI KAYIT SENARYOSU ---
    console.log('Öğrenci Kayıt formu başarıyla gönderildi.');

    // Başarı Mesajı
    this.toastService.show(
      'Kayıt işleminiz başarıyla tamamlandı! Yönlendiriliyorsunuz...',
      'success'
    );

    // İsteğe bağlı: Yönlendirme vb.
    // setTimeout(() => this.router.navigate(['/login']), 2000);
  }
}
