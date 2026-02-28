import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { ToastService } from '../../services/toast.services';
import { AuthService } from '../../services/auth.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';

@Component({
  selector: 'app-corporate-verification',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ToastComponent, LumaSpinComponent],
  templateUrl: './corporate-verification.html',
  styleUrls: ['./corporate-verification.scss'],
})
export class CorporateVerificationComponent implements OnInit, OnDestroy {
  email: string = '';
  code: string = '';
  isLoading: boolean = false;
  isResending: boolean = false;
  errorMessage: string = '';
  /** Kodu tekrar gönder butonu için geri sayım (saniye). 0 = tıklanabilir */
  resendCountdown: number = 0;
  private resendInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const params = this.route.snapshot.queryParams;
    this.email = params['email'] || '';
    if (!this.email) {
      this.router.navigate(['/corporate-login']);
    }
  }

  ngOnDestroy(): void {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendInterval = null;
    }
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').slice(0, 6);
    this.code = value;
    input.value = value;
    this.errorMessage = '';
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.email) {
      this.toastService.show('E-posta adresi bulunamadı.', 'error');
      return;
    }
    if (!this.code || this.code.length !== 6) {
      this.errorMessage = 'Lütfen 6 haneli doğrulama kodunu girin.';
      this.toastService.show(this.errorMessage, 'error');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyCorporateCode(this.email, this.code).subscribe({
      next: () => {
        this.toastService.show('Doğrulama başarılı! Yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
          this.isLoading = false;
          this.router.navigate(['/']).catch(() => {
            if (isPlatformBrowser(this.platformId)) {
              window.location.href = '/';
            }
          });
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        const msg =
          err?.error?.message ||
          err?.message ||
          'Doğrulama kodu geçersiz veya süresi dolmuş. Lütfen tekrar deneyin veya yeni kod isteyin.';
        this.errorMessage = msg;
        this.toastService.show(msg, 'error');
      },
    });
  }

  resendCode(): void {
    if (!this.email || this.resendCountdown > 0) return;

    // Sayaç hemen başlasın; buton tıklanamaz kalsın, metin sayacı göstersin
    this.startResendCountdown();
    this.isResending = true;

    this.authService.resendCorporateVerificationCode(this.email).subscribe({
      next: (data) => {
        const message = data?.message || 'Doğrulama kodu e-posta adresinize tekrar gönderildi.';
        this.toastService.show(message, 'success');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Kod gönderilemedi. Lütfen tekrar deneyin.';
        this.toastService.show(msg, 'error');
      },
      complete: () => {
        this.isResending = false;
      },
    });
  }

  private startResendCountdown(): void {
    this.resendCountdown = 60;
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
    this.resendInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0 && this.resendInterval) {
        clearInterval(this.resendInterval);
        this.resendInterval = null;
      }
    }, 1000);
  }
}
