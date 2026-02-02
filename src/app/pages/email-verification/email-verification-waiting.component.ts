import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { Logger } from '../../utils/logger.util';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-email-verification-waiting',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent, LumaSpinComponent],
  templateUrl: './email-verification-waiting.component.html',
  styleUrls: ['./email-verification-waiting.component.scss'],
})
export class EmailVerificationWaitingComponent implements OnInit {
  email: string = '';
  isResending: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // URL'den email'i al (kayıt sayfasından gönderilecek)
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  async resendEmail() {
    if (!this.email) {
      this.toastService.show('E-posta adresi bulunamadı.', 'error');
      return;
    }

    this.isResending = true;

    try {
      const response = await fetch(`${environment.apiUrl}/Auth/resend-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email.trim(),
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend sunucusuna bağlanılamıyor...');
      }

      const data = await response.json();

      if (response.ok) {
        this.toastService.show('Doğrulama maili tekrar gönderildi. Lütfen e-postanızı kontrol edin.', 'success');
      } else {
        const errorMessage = data.message || 'Mail gönderilemedi. Lütfen tekrar deneyiniz.';
        this.toastService.show(errorMessage, 'error');
      }
    } catch (error: any) {
      Logger.error('Mail tekrar gönderme hatası:', error);
      this.toastService.show(
        error.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.',
        'error'
      );
    } finally {
      this.isResending = false;
    }
  }
}
