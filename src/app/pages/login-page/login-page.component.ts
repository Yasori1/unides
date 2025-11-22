import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-page', // Component selector'ı projenize göre güncelleyebilirsiniz
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
  emailError: boolean = false;

  validateStudentEmail(event: any) {
    const email = event.target.value;

    // Eğer input boşsa hatayı temizle
    if (!email) {
      this.emailError = false;
      return;
    }

    // E-posta format kontrolü:
    // 1. İçinde @ işareti olmalı
    // 2. Sonu .edu.tr ile bitmeli
    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.emailError) {
      // Eğer hata varsa formu gönderme veya uyarı ver
      alert('Lütfen geçerli bir öğrenci e-postası giriniz.');
    } else {
      // Başarılı form gönderimi
      console.log('Form başarıyla gönderildi.');
    }
  }
}
