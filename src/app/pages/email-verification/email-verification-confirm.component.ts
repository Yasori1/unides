import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { AuthService } from '../../services/auth.services';
import { Logger } from '../../utils/logger.util';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-email-verification-confirm',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent, LumaSpinComponent],
  templateUrl: './email-verification-confirm.component.html',
  styleUrls: ['./email-verification-confirm.component.scss'],
})
export class EmailVerificationConfirmComponent implements OnInit, OnDestroy {
  token: string = '';
  isLoading: boolean = true;
  isVerified: boolean = false;
  isError: boolean = false;
  errorMessage: string = '';
  private redirectTimeout?: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // URL'den token'ı al
    this.token =
      this.route.snapshot.queryParams['token'] || this.route.snapshot.params['token'] || '';

    if (this.token) {
      this.verifyEmail();
    } else {
      this.isLoading = false;
      this.isError = true;
      this.errorMessage = 'Geçersiz veya eksik doğrulama linki.';
      this.toastService.show('Geçersiz veya eksik doğrulama linki.', 'error');

      this.redirectTimeout = setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  async verifyEmail() {
    this.isLoading = true;
    this.isError = false;
    this.isVerified = false;

    try {
      // POST API_BASE_URL/api/auth/verify-email — Body: { "token": "URL'den_alinan_token" }
      const response = await fetch(`${environment.apiUrl}/Auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.token,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend sunucusuna bağlanılamıyor...');
      }

      const data = await response.json();

      if (response.ok) {
        this.isVerified = true;
        this.isLoading = false;

        // Backend: accessToken + refreshToken döner; token'ları sakla, öğrenci giriş sayfasına yönlendir
        const accessToken = data.accessToken ?? data.AccessToken ?? data.token ?? data.Token;
        const refreshToken = data.refreshToken ?? data.RefreshToken ?? data.refresh;

        if (accessToken) {
          this.authService.saveToken(accessToken);
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
          }
          if (data.user) {
            this.authService.saveUser(data.user);
            const role = data.user.role ?? data.user.RoleName ?? data.roleName ?? 'student';
            this.authService.saveUserType(role);
          } else {
            this.authService.saveUserType('student');
          }

          this.toastService.show(
            'E-posta adresiniz doğrulandı. Yönlendiriliyorsunuz...',
            'success'
          );
          const returnUrl = sessionStorage.getItem('community_register_return');
          const target = returnUrl || '/login';
          if (returnUrl) sessionStorage.removeItem('community_register_return');
          setTimeout(() => {
            this.router.navigateByUrl(target);
          }, 2000);
        } else {
          this.toastService.show(
            'E-posta adresiniz doğrulandı. Yönlendiriliyorsunuz...',
            'success'
          );
          const returnUrl = sessionStorage.getItem('community_register_return');
          const target = returnUrl || '/login';
          if (returnUrl) sessionStorage.removeItem('community_register_return');
          setTimeout(() => {
            this.router.navigateByUrl(target);
          }, 2000);
        }
      } else {
        this.isLoading = false;
        this.isError = true;
        const errorMessage = data.message || 'E-posta doğrulama işlemi başarısız oldu.';
        this.errorMessage = errorMessage;
        this.toastService.show(errorMessage, 'error');

        this.redirectTimeout = setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    } catch (error: any) {
      Logger.error('E-posta doğrulama hatası:', error);
      this.isLoading = false;
      this.isError = true;
      this.errorMessage = error.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.';
      this.toastService.show(this.errorMessage, 'error');

      this.redirectTimeout = setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }
  }
}
