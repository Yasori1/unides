import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink], // *ngIf ve routerLink kullanımı için gerekli
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Spline viewer etiketini tanıması için
})
export class LoginPageComponent implements OnInit {
  emailError: boolean = false;

  ngOnInit(): void {
    // Spline Viewer scriptini buraya da ekliyoruz ki login sayfasında da 3D model çalışsın
    // Eğer script daha önce yüklendiyse tekrar yüklemeye çalışmaz
    const scriptCheck = document.querySelector(
      'script[src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"]'
    );

    if (!scriptCheck) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
      document.head.appendChild(script);
    }
  }

  validateStudentEmail(event: any) {
    const email = event.target.value;

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
      // Eğer hata varsa uyarı ver
      alert('Lütfen geçerli bir öğrenci e-postası giriniz (.edu.tr).');
    } else {
      // Başarılı form gönderimi simülasyonu
      console.log('Form başarıyla gönderildi.');
    }
  }
}
