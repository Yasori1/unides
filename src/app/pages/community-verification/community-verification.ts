import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { ToastService } from '../../services/toast.services';
import { AuthService } from '../../services/auth.services';
import { CommunityService } from '../../services/community.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-community-verification',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ToastComponent, LumaSpinComponent],
  templateUrl: './community-verification.html',
  styleUrls: ['./community-verification.scss'],
})
export class CommunityVerificationComponent implements OnInit, OnDestroy {
  email = '';
  otpRequestId = '';
  code = '';
  isLoading = false;
  isResending = false;
  errorMessage = '';
  resendCountdown = 0;
  private resendInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private authService: AuthService,
    private communityService: CommunityService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras?.state as { email?: string; otpRequestId?: string }) ?? (history.state ?? {});
    const queryEmail = this.route.snapshot.queryParams['email'];
    const queryOtp = this.route.snapshot.queryParams['otpRequestId'];
    this.email = state?.email ?? queryEmail ?? '';
    this.otpRequestId = state?.otpRequestId ?? queryOtp ?? '';
    if (!this.otpRequestId || !this.email) {
      this.toastService.show('Doğrulama sayfasına erişim bilgisi eksik. Lütfen tekrar giriş yapın.', 'error');
      this.router.navigate(['/community-login']);
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
    const value = input.value.replace(/\D/g, '').slice(0, 6);
    this.code = value;
    input.value = value;
    this.errorMessage = '';
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.otpRequestId) {
      this.toastService.show('Oturum bilgisi eksik. Lütfen tekrar giriş yapın.', 'error');
      this.router.navigate(['/community-login']);
      return;
    }
    if (!this.code || this.code.length !== 6) {
      this.errorMessage = 'Lütfen 6 haneli doğrulama kodunu girin.';
      this.toastService.show(this.errorMessage, 'error');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyLoginOtp(this.otpRequestId, this.code).subscribe({
      next: () => {
        this.toastService.show('Doğrulama başarılı! Yönlendiriliyorsunuz...', 'success');
        this.communityService
          .getMyLeadCommunity()
          .pipe(take(1), catchError(() => of(null)))
          .subscribe({
            next: (community) => {
              this.authService.saveCommunityApproved(community?.isActivity === true);
              this.isLoading = false;
              setTimeout(() => {
                this.router.navigate(['/']).catch(() => {
                  if (isPlatformBrowser(this.platformId)) {
                    window.location.href = '/';
                  }
                });
              }, 800);
            },
            error: () => {
              this.authService.saveCommunityApproved(true);
              this.isLoading = false;
              setTimeout(() => this.router.navigate(['/']), 800);
            },
          });
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
    if (!this.otpRequestId || this.resendCountdown > 0) return;

    this.startResendCountdown();
    this.isResending = true;

    this.authService.resendLoginOtp(this.otpRequestId).subscribe({
      next: (data: any) => {
        const newId = data?.otpRequestId || data?.OtpRequestId;
        if (newId) {
          this.otpRequestId = newId;
        }
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
