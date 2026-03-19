import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { AuthService } from '../../services/auth.services';
import { Logger } from '../../utils/logger.util';

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
  /** Topluluk kaydı akışı (doğrulama sonrası Adım 3'e yönlendirilecek) */
  isCommunityFlow: boolean = false;
  private redirectTimeout?: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isCommunityFlow = !!(
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem('community_register_return')
    );
    // Backend maildeki linki /verify-email#token=... olarak gönderiyor (token fragment'ta).
    // Query (?token=) ve route param da yedek olarak okunur.
    this.token = this.getTokenFromRoute();

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

  /** Token'ı önce fragment (#token=...), sonra query (?token=), sonra route param'dan al */
  private getTokenFromRoute(): string {
    if (typeof window === 'undefined') return '';

    // 1) location.hash: "#token=..." (ve gateway'in ekleyebileceği "#?token=..." varyantı)
    const rawHash = window.location.hash || '';
    const hashWithoutSharp = rawHash.startsWith('#') ? rawHash.substring(1) : rawHash;
    const hashClean = hashWithoutSharp.startsWith('?') ? hashWithoutSharp.substring(1) : hashWithoutSharp;
    if (hashClean) {
      const hashParams = new URLSearchParams(hashClean);
      const fromHash = hashParams.get('token');
      if (fromHash) return fromHash;
    }

    // 2) location.search: "?token=..."
    const searchParams = new URLSearchParams(window.location.search || '');
    const fromSearch = searchParams.get('token');
    if (fromSearch) return fromSearch;

    // 3) Son çare olarak route query/params
    return this.route.snapshot.queryParams['token'] || this.route.snapshot.params['token'] || '';
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  verifyEmail(): void {
    this.isLoading = true;
    this.isError = false;
    this.isVerified = false;

    this.authService.verifyEmail(this.token).subscribe({
      next: (data) => {
        this.isVerified = true;
        this.isLoading = false;

        const requiresSetup = data.requiresCommunitySetup ?? data.RequiresCommunitySetup;
        const setupToken = data.setupToken ?? data.SetupToken;

        if (requiresSetup && setupToken) {
          sessionStorage.setItem('community_setup_token', setupToken);
          const email = data.email ?? data.Email;
          if (email) {
            sessionStorage.setItem('community_register_email', email);
          }
          if (data.setupTokenExpiresAt ?? data.SetupTokenExpiresAt) {
            sessionStorage.setItem(
              'community_setup_token_expires',
              (data.setupTokenExpiresAt ?? data.SetupTokenExpiresAt) ?? ''
            );
          }
          this.toastService.show(
            'E-posta doğrulandı. Topluluk bilgilerini gireceğiniz adıma yönlendiriliyorsunuz...',
            'success'
          );
          this.redirectTimeout = setTimeout(() => {
            this.router.navigateByUrl('/community-register?step=3');
          }, 2000);
          return;
        }

        const accessToken = data.accessToken ?? data.AccessToken ?? data.token ?? data.Token;
        const refreshToken = data.refreshToken ?? data.RefreshToken ?? data.refresh;

        if (accessToken) {
          this.authService.saveToken(accessToken);
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
          }
          if (data.user) {
            this.authService.saveUser(data.user);
            const role = data.user.role ?? (data.user as any).RoleName ?? data.roleName ?? 'student';
            this.authService.saveUserType(role);
          } else {
            const roleName = data.roleName ?? data.RoleName ?? 'student';
            const userObj = {
              id: data.id,
              name: data.fullName ?? data.FullName,
              email: data.email ?? data.Email,
              role: roleName,
            };
            this.authService.saveUser(userObj);
            this.authService.saveUserType(roleName);
          }
        }

        this.toastService.show(
          this.isCommunityFlow
            ? 'E-posta doğrulandı. Topluluk bilgilerini gireceğiniz adıma yönlendiriliyorsunuz...'
            : 'E-posta adresiniz doğrulandı. Yönlendiriliyorsunuz...',
          'success'
        );
        const returnUrl = sessionStorage.getItem('community_register_return');
        const target = returnUrl || (this.isCommunityFlow ? '/community-register?step=3' : '/community-login');
        if (returnUrl) sessionStorage.removeItem('community_register_return');
        this.redirectTimeout = setTimeout(() => {
          this.router.navigateByUrl(target);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        const message = err?.error?.message ?? err?.message ?? 'E-posta doğrulama işlemi başarısız oldu.';
        this.errorMessage = message;
        this.toastService.show(message, 'error');
        Logger.error('E-posta doğrulama hatası:', err);
        this.redirectTimeout = setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
    });
  }
}
