import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// Toast için gerekli importlar
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ToastComponent], // ToastComponent EKLENDİ
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginPageComponent implements OnInit {
  emailError: boolean = false;

  // Servisi constructor'a ekledik
  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
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

    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.emailError) {
      // Hata Bildirimi
      this.toastService.show('Lütfen geçerli bir öğrenci e-postası (.edu.tr) giriniz.', 'error');
    } else {
      // Başarılı Giriş Bildirimi
      console.log('Form başarıyla gönderildi.');
      this.toastService.show('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
    }
  }
}
