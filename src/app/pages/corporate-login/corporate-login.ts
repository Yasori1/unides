import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';

@Component({
  selector: 'app-corporate-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent],
  templateUrl: './corporate-login.html',
  styleUrls: ['./corporate-login.scss'],
})
export class CorporateLoginComponent {
  emailError: boolean = false;

  constructor(private router: Router, private toastService: ToastService) {}

  validateStudentEmail(event: any) {
    const email = event.target.value;
    if (!email) {
      this.emailError = false;
      return;
    }
    // Kurumsal e-posta kontrolü (Örn: .gov.tr veya .edu.tr)
    // Basit kontrol: İçinde @ varsa kabul et (Geliştirilebilir)
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

    const email = emailInput.value;
    const password = passwordInput.value;

    // 1. Boş Alan Kontrolü
    if (!email || !password) {
      this.toastService.show('Lütfen e-posta ve şifre alanlarını doldurunuz.', 'error');
      return;
    }

    // 2. Format Hatası Kontrolü
    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir kurumsal e-posta giriniz.', 'error');
      return;
    }

    // 3. Başarılı Giriş Simülasyonu
    console.log('Kurumsal giriş başarılı.');
    this.toastService.show('Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz...', 'success');

    // 1.5 Saniye sonra Dashboard'a yönlendir
    setTimeout(() => {
      this.router.navigate(['/corporate-dashboard']);
    }, 1500);
  }
}
