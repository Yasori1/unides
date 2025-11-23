<<<<<<< Updated upstream
import { Component } from '@angular/core';
<<<<<<< Updated upstream
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
=======
import { RouterLink } from '@angular/router';
=======
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
>>>>>>> Stashed changes

// DİKKAT: Statik import kaldırıldı çünkü SSR hatasına yol açıyor.
// import '@splinetool/viewer';

@Component({
<<<<<<< Updated upstream
    selector: 'app-login-page',
    imports: [RouterLink],
    templateUrl: './login-page.component.html',
    styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {}
=======
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements AfterViewInit {
  emailError: boolean = false;

  // Platform ID'sini inject ediyoruz ki nerede çalıştığımızı (Server mı Browser mı) anlayabilelim
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    // Eğer kod Tarayıcıda (Browser) çalışıyorsa kütüphaneyi yükle
    if (isPlatformBrowser(this.platformId)) {
      import('@splinetool/viewer');
    }
  }

  validateStudentEmail(event: any) {
    const email = event.target.value;

>>>>>>> Stashed changes
    if (!email) {
      this.emailError = false;
      return;
    }

<<<<<<< Updated upstream
    // E-posta format kontrolü:
    // 1. İçinde @ işareti olmalı
    // 2. Sonu .edu.tr ile bitmeli
=======
>>>>>>> Stashed changes
    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.emailError) {
<<<<<<< Updated upstream
      // Eğer hata varsa formu gönderme veya uyarı ver
      alert('Lütfen geçerli bir öğrenci e-postası giriniz.');
    } else {
      // Başarılı form gönderimi
=======
      alert('Lütfen geçerli bir öğrenci e-postası giriniz.');
    } else {
>>>>>>> Stashed changes
      console.log('Form başarıyla gönderildi.');
    }
  }
}
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
>>>>>>> Stashed changes
