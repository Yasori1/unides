import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
})
export class RegisterPageComponent {
  emailError: boolean = false;
  passwordMismatch: boolean = false;

  private password = '';
  private confirmPassword = '';

  // Sadece numara girilmesine izin verir (TC ve Tel için)
  onlyNumbers(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  // Öğrenci E-posta Doğrulama (.edu.tr)
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
      alert('Lütfen geçerli bir öğrenci e-postası giriniz.');
      return;
    }

    if (this.passwordMismatch) {
      alert('Şifreler eşleşmiyor!');
      return;
    }

    // Buraya kayıt işlemleri gelecek (API call vb.)
    console.log('Öğrenci Kayıt formu başarıyla gönderildi.');
    alert('Öğrenci Kaydı Başarılı! (Simülasyon)');
  }
}
