import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
// Servisler
import { ToastService } from '../../services/toast.services';
import { AuthService, LoginResponse } from '../../services/auth.services';
import { CommunityService } from '../../services/community.services';
// Bileşenler
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
// Http Client
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { Logger } from '../../utils/logger.util';

@Component({
  selector: 'app-community-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ToastComponent,
    HttpClientModule,
    LumaSpinComponent,
    FormsModule,
  ],
  templateUrl: './community-login.html',
  styleUrls: ['./community-login.scss'],
  // BU SATIR EKLENMELİ: Spline gibi custom element'leri tanıması için gereklidir
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CommunityLoginComponent implements OnInit, OnDestroy {
  emailError: boolean = false;
  isLoading: boolean = false;
  isCheckingApproval: boolean = false;
  showPassword: boolean = false;
  showForgotPasswordModal: boolean = false;
  forgotPasswordEmail: string = '';
  forgotEmailError: boolean = false;
  isSendingEmail: boolean = false;
  emailSent: boolean = false;
  /** Giriş başarılı ama topluluk henüz onaylanmadığında form yerine bu mesaj gösterilir */
  showPendingApprovalMessage: boolean = false;
  /** Topluluk adı (pending ekranında göstermek için) */
  pendingCommunityName: string = '';
  private popStateListener?: (event: PopStateEvent) => void;

  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private communityService: CommunityService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) { }

  ngOnInit(): void {
    // Spline Viewer scriptini dinamik olarak yükle
    const scriptCheck = document.querySelector(
      'script[src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"]'
    );

    if (!scriptCheck) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
      document.head.appendChild(script);
    }

    // Geri butonuna basıldığında anasayfaya yönlendir
    this.popStateListener = (event: PopStateEvent) => {
      // State kontrolü yap - eğer bizim eklediğimiz state ise veya community-login sayfasındaysak
      if (
        (event.state && event.state.fromCommunityLogin) ||
        this.router.url === '/community-login'
      ) {
        // window.location kullanarak direkt anasayfaya yönlendir (Angular Router'ı bypass eder)
        window.location.href = '/';
      }
    };
    window.addEventListener('popstate', this.popStateListener);

    // History'ye bir entry ekle ki geri butonuna basıldığında popstate tetiklensin
    history.pushState({ fromCommunityLogin: true }, '', location.href);

    // --- Zaten giriş yapmış topluluk başkanı mı? Onay durumunu kontrol et ---
    this.checkIfAlreadyLoggedInAndPending();
  }

  /**
   * Sayfa yüklendiğinde: Kullanıcı zaten giriş yapmışsa ve topluluk onay bekliyor ise
   * pending ekranını göster. Onaylıysa anasayfaya/dashboard'a yönlendir.
   */
  private checkIfAlreadyLoggedInAndPending(): void {
    // Kullanıcı giriş yapmış mı ve topluluk rolünde mi?
    if (!this.authService.isAuthenticated() || this.authService.getUserType() !== 'community') {
      return;
    }

    this.isCheckingApproval = true;

    // Backend'den güncel topluluk bilgisini al
    this.communityService
      .getMyLeadCommunity()
      .pipe(take(1), catchError(() => of(null)))
      .subscribe({
        next: (community) => {
          this.isCheckingApproval = false;
          if (community) {
            // Onay beklese de onaylı olsa da anasayfaya yönlendir (Onay Sürecindedir sayfası kaldırıldı)
            this.authService.saveCommunityApproved(community.isActivity === true);
            this.router.navigate(['/']);
          }
          // community === null → lead-by-me yok, formu göstermeye devam et
        },
        error: () => {
          this.isCheckingApproval = false;
        },
      });
  }

  ngOnDestroy(): void {
    if (this.popStateListener) {
      window.removeEventListener('popstate', this.popStateListener);
    }
  }

  togglePasswordVisibility(input: HTMLInputElement) {
    this.showPassword = !this.showPassword;
    input.type = this.showPassword ? 'text' : 'password';
  }

  validateCommunityEmail(event: any) {
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

    if (this.isLoading) return;

    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // 1. Validasyonlar
    if (!email || !password) {
      this.toastService.show('Lütfen e-posta ve şifre alanlarını doldurunuz.', 'error');
      return;
    }

    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir topluluk e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    // 2. BACKEND SORGUSU BAŞLIYOR
    this.isLoading = true;

    this.authService.loginCommunity(email, password).subscribe({
      next: (response: LoginResponse) => {
        const requiresOtp = (response as any)?.requiresOtp === true;
        const otpRequestId =
          (response as any)?.otpRequestId || (response as any)?.OtpRequestId || '';
        const responseEmail =
          (response as any)?.email || (response as any)?.Email || email;

        if (requiresOtp && otpRequestId) {
          this.isLoading = false;
          this.toastService.show(
            'Doğrulama kodu e-posta adresinize gönderildi. Lütfen kodu girin.',
            'success'
          );
          this.router.navigate(['/community-verification'], {
            state: { email: responseEmail, otpRequestId },
            queryParams: { email: responseEmail, otpRequestId },
          });
          return;
        }

        // Giriş başarılı; token kaydedildi. Kendi topluluğumuzu (onay bekleyen dahil) lead-by-me ile al
        this.communityService
          .getMyLeadCommunity()
          .pipe(take(1), catchError(() => of(null)))
          .subscribe({
            next: (community) => {
              this.isLoading = false;
              const nextUrl = this.route.snapshot.queryParams['next'];

              // Giriş başarılı (onay beklese de onaylı olsa da): anasayfaya yönlendir
              this.authService.saveCommunityApproved(community?.isActivity === true);
              const target = nextUrl || '/';
              this.toastService.show('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
              setTimeout(() => this.router.navigateByUrl(target), 800);
            },
            error: () => {
              this.isLoading = false;
              // lead-by-me hatası — güvenli varsayılan: anasayfaya yönlendir
              this.authService.saveCommunityApproved(true);
              const target = this.route.snapshot.queryParams['next'] || '/';
              this.toastService.show('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
              setTimeout(() => this.router.navigateByUrl(target), 800);
            },
          });
      },
      error: (error: HttpErrorResponse) => {
        // --- HATALI GİRİŞ ---
        this.isLoading = false;
        Logger.error('Giriş Hatası:', error);

        const rawMessage =
          error.error?.message ||
          (error.error as any)?.Message ||
          error.message ||
          '';
        const rawLower = (rawMessage || '').toLowerCase();

        // Backend LoginCommand: RoleId 4 = reddedilmiş, RoleId 5 = silinmiş; bu kullanıcılar giriş yapamaz, tekrar topluluk kaydı oluşturabilir.
        const isOnceRejectedThenDeleted =
          rawLower.includes('önce reddedilmiş') && (rawLower.includes('sonra silinmiştir') || rawLower.includes('sonra silinmis'));
        const isRejected = rawLower.includes('reddedilmiştir') || rawLower.includes('reddedilmis');
        const isDeleted = rawLower.includes('silinmiştir') || rawLower.includes('silinmis');

        if (isOnceRejectedThenDeleted || isRejected || isDeleted) {
          this.toastService.show(
            'Topluluğunuz silinmiş veya reddedilmiş olabilir, mail adresinize gelen gerekçe ile tekrardan topluluğunuzu oluşturabilirsiniz.',
            'error'
          );
          return;
        }

        const message = rawMessage || 'E-posta veya şifre hatalı!';
        this.toastService.show(message, 'error');
      },
    });
  }

  openForgotPasswordModal() {
    this.showForgotPasswordModal = true;
    this.forgotPasswordEmail = '';
    this.forgotEmailError = false;
    this.emailSent = false;
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal = false;
    this.forgotPasswordEmail = '';
    this.forgotEmailError = false;
    this.emailSent = false;
  }

  /** Onay bekleyen ekranındayken çıkış yapıp tekrar giriş formunu göstermek için */
  logoutAndShowForm(): void {
    // Logout normalde anasayfaya yönlendirir; onu bypass edip burada kalıyoruz
    // Manuel temizlik yapıyoruz
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');
    localStorage.removeItem('community_approved');
    this.showPendingApprovalMessage = false;
    this.pendingCommunityName = '';
    this.toastService.show('Çıkış yapıldı.', 'success');
  }

  /** Onay durumunu tekrar kontrol et (kullanıcı "Durumu Kontrol Et" butonuna bastığında) */
  recheckApprovalStatus(): void {
    if (!this.authService.isAuthenticated()) {
      this.toastService.show('Oturum süresi dolmuş. Lütfen tekrar giriş yapınız.', 'error');
      this.logoutAndShowForm();
      return;
    }

    this.isCheckingApproval = true;

    this.communityService
      .getMyLeadCommunity()
      .pipe(take(1), catchError(() => of(null)))
      .subscribe({
        next: (community) => {
          this.isCheckingApproval = false;
          if (community && community.isActivity === true) {
            // Topluluk onaylandı!
            this.authService.saveCommunityApproved(true);
            this.toastService.show('Topluluğunuz onaylandı! Anasayfaya yönlendiriliyorsunuz...', 'success');
            setTimeout(() => this.router.navigate(['/']), 1200);
          } else {
            this.toastService.show('Topluluğunuz henüz onay sürecinde.', 'error');
          }
        },
        error: () => {
          this.isCheckingApproval = false;
          this.toastService.show('Durum kontrol edilemedi. Lütfen tekrar deneyiniz.', 'error');
        },
      });
  }

  validateForgotEmail(event: any) {
    const email = event.target.value.trim();

    if (!email) {
      this.forgotEmailError = false;
      return;
    }

    // E-posta formatı kontrolü: @ işareti olmalı ve .edu.tr ile bitmeli
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]) {
      // @ işareti yoksa veya @ işaretinden önce/sonra boşsa
      this.forgotEmailError = true;
      return;
    }

    // .edu.tr ile bitmeli
    if (!email.endsWith('.edu.tr')) {
      this.forgotEmailError = true;
    } else {
      this.forgotEmailError = false;
    }
  }

  async sendPasswordResetEmail() {
    const email = this.forgotPasswordEmail.trim();

    if (!email) {
      this.toastService.show('Lütfen e-posta adresinizi giriniz.', 'error');
      return;
    }

    // E-posta formatı kontrolü
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1] || !email.endsWith('.edu.tr')) {
      this.toastService.show('Lütfen geçerli bir topluluk e-postası (.edu.tr) giriniz.', 'error');
      this.forgotEmailError = true;
      return;
    }

    if (this.forgotEmailError) {
      this.toastService.show('Lütfen geçerli bir topluluk e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    this.isSendingEmail = true;
    this.emailSent = false;

    try {
      const response = await fetch('/api/Auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.forgotPasswordEmail.trim(),
        }),
      });

      // Response'un JSON olup olmadığını kontrol et
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.toastService.show('Sunucuya Bağlanılamadı', 'error');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        this.emailSent = true;
        this.toastService.show('Şifre sıfırlama linki e-posta adresinize gönderildi.', 'success');
        setTimeout(() => {
          this.closeForgotPasswordModal();
        }, 3000);
      } else {
        // Mail bulunamadı kontrolü
        const errorMessage = data.message || '';
        const lowerMessage = errorMessage.toLowerCase();

        if (
          response.status === 404 ||
          lowerMessage.includes('not found') ||
          lowerMessage.includes('bulunamadı') ||
          lowerMessage.includes('kullanıcı bulunamadı') ||
          lowerMessage.includes('email not found') ||
          lowerMessage.includes('e-posta bulunamadı')
        ) {
          this.toastService.show('Mail bulunamadı', 'error');
        } else if (errorMessage) {
          this.toastService.show(errorMessage, 'error');
        } else {
          this.toastService.show('Bir hata oluştu. Lütfen tekrar deneyiniz.', 'error');
        }
      }
    } catch (error: any) {
      Logger.error('Şifre sıfırlama hatası:', error);
      // Network hatası veya fetch hatası
      if (error.message && error.message.includes('fetch')) {
        this.toastService.show('Sunucuya Bağlanılamadı', 'error');
      } else {
        this.toastService.show('Sunucuya Bağlanılamadı', 'error');
      }
    } finally {
      this.isSendingEmail = false;
    }
  }
}
