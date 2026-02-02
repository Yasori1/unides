import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { Logger } from '../../utils/logger.util';
import { AuthService } from '../../services/auth.services';

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
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // URL'den email'i al (kayıt sayfasından redirectUrl ile gelir)
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  resendEmail(): void {
    if (!this.email) {
      this.toastService.show('E-posta adresi bulunamadı.', 'error');
      return;
    }

    this.isResending = true;
    this.authService.resendVerificationEmail(this.email).subscribe({
      next: (data) => {
        const message =
          data?.message || 'Doğrulama maili tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.';
        this.toastService.show(message, 'success');
      },
      error: (err) => {
        const message =
          err?.error?.message || err?.message || 'Mail gönderilemedi. Lütfen tekrar deneyiniz.';
        this.toastService.show(message, 'error');
        Logger.error('Mail tekrar gönderme hatası:', err);
      },
      complete: () => {
        this.isResending = false;
      },
    });
  }
}
